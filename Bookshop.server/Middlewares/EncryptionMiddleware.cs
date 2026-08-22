using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Bookshop.Middlewares;

public class EncryptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly byte[] _key;

    public EncryptionMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        string keyStr = config["Encryption:Key"]
                        ?? config["Jwt:Key"]
                        ?? "DefaultSecretKey32BytesLongString!";

        byte[] keyBytes = Encoding.UTF8.GetBytes(keyStr);
        if (keyBytes.Length != 32)
        {
            Array.Resize(ref keyBytes, 32);
        }
        _key = keyBytes;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if X-Encrypt-Payload header is present
        if (!context.Request.Headers.ContainsKey("X-Encrypt-Payload"))
        {
            await _next(context);
            return;
        }

        // Decrypt incoming Request Body if present
        if (context.Request.ContentLength > 0 || context.Request.Body.CanRead)
        {
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            string encryptedRequest = await reader.ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(encryptedRequest))
            {
                try
                {
                    string decryptedJson = DecryptString(encryptedRequest.Trim());
                    byte[] decryptedBytes = Encoding.UTF8.GetBytes(decryptedJson);
                    context.Request.Body = new MemoryStream(decryptedBytes);
                    context.Request.ContentLength = decryptedBytes.Length;
                    context.Request.ContentType = "application/json";
                }
                catch
                {
                    // Reset stream position if decryption attempt fails
                    context.Request.Body.Seek(0, SeekOrigin.Begin);
                }
            }
        }

        // Encrypt outgoing Response Body
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        await _next(context);

        context.Response.Body = originalBodyStream;
        responseBody.Seek(0, SeekOrigin.Begin);
        var plainText = await new StreamReader(responseBody).ReadToEndAsync();

        if (!string.IsNullOrEmpty(plainText))
        {
            var encryptedBase64 = EncryptString(plainText);
            context.Response.ContentType = "text/plain";
            await context.Response.WriteAsync(encryptedBase64);
        }
    }

    private string EncryptString(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        ms.Write(aes.IV, 0, aes.IV.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var writer = new StreamWriter(cs))
        {
            writer.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    private string DecryptString(string cipherTextBase64)
    {
        byte[] cipherBytes = Convert.FromBase64String(cipherTextBase64);
        using var aes = Aes.Create();
        aes.Key = _key;

        byte[] iv = new byte[aes.BlockSize / 8];
        Array.Copy(cipherBytes, 0, iv, 0, iv.Length);
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipherBytes, iv.Length, cipherBytes.Length - iv.Length);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var reader = new StreamReader(cs);

        return reader.ReadToEnd();
    }
}

public static class EncryptionMiddlewareExtensions
{
    public static IApplicationBuilder UseEncryptionMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<EncryptionMiddleware>();
    }
}
