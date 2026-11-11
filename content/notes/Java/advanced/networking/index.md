# 网络编程

网络编程使不同进程能够交换数据。Java 提供 Socket、数据报和 HTTP 客户端等 API；使用时既要选择协议，也要约定消息格式、字符编码、超时和资源释放方式。

## 基本概念

| 概念 | 含义 |
| --- | --- |
| IP 地址 | 标识网络接口或通信目标 |
| 端口 | 在主机上区分不同的通信端点 |
| TCP | 提供面向连接、可靠、有序的字节流 |
| UDP | 以数据报为单位发送，不保证送达或顺序 |
| HTTP | 规定请求、响应、方法、状态码和头部等应用层语义 |

TCP 与 UDP 的主要区别：

| 比较项 | TCP | UDP |
| --- | --- | --- |
| 连接 | 建立连接后通信 | 无连接，直接发送数据报 |
| 可靠性 | 保证按序送达，丢失自动重传 | 可能丢失、重复或乱序 |
| 边界 | 字节流，没有消息边界 | 保留数据报边界 |
| 适用场景 | 文件传输、HTTP、数据库连接 | 实时音视频、游戏状态、DNS 查询 |

TCP 不保留应用消息边界。一次写入不一定对应对端的一次读取，应用需要约定分隔符、固定长度或长度前缀等规则。

## Java 网络 API

| API | 用途 |
| --- | --- |
| `Socket` | 建立 TCP 客户端连接，读写字节流 |
| `ServerSocket` | 监听并接受 TCP 连接 |
| `DatagramSocket` | 发送和接收 UDP 数据报 |
| `URI` | 表示和解析资源标识符 |
| `HttpClient` | 发送 HTTP 请求，获取响应或异步结果 |

HTTP 业务通常可以先使用 `java.net.http.HttpClient`，只有需要直接控制传输过程时才下探到 Socket 等 API。

常见网络异常：

| 异常 | 常见触发 |
| --- | --- |
| `UnknownHostException` | 主机名无法解析 |
| `ConnectException` | 目标拒绝连接或不可达 |
| `SocketTimeoutException` | 连接或读取超时 |
| `MalformedURLException` | 地址格式不符合规范 |

## 示例：访问本地 HTTP 服务

为便于直接运行，下面的程序先用 JDK 自带的 `HttpServer` 启动一个本地服务，再用 `HttpClient` 发出请求。地址只绑定 `127.0.0.1`，端口由系统分配，不需要访问外部网站。

```java title="Main.java"
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/topic", exchange -> {
            byte[] body = "Java networking".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            } finally {
                exchange.close();
            }
        });
        server.start();

        try (HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build()) {
            URI uri = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/topic");
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            System.out.println("Status: " + response.statusCode());
            System.out.println("Body: " + response.body());
        } finally {
            server.stop(0);
        }
    }
}
```

**输出：**

```text
Status: 200
Body: Java networking
```

`connectTimeout` 约束新连接的建立过程，请求上的 `timeout` 约束该请求等待响应的时间。它们不是完全相同的概念。`send` 同步等待响应，`sendAsync` 则返回 `CompletableFuture`。

`HttpServer` 属于 JDK 的 `jdk.httpserver` 模块；使用自行裁剪的运行时时，需要包含该模块。本例用于解释请求与响应，完整 Web 应用可以进一步使用[框架](../../framework/overview.md)。

## Socket 中的消息边界

若约定一行文本是一条消息，发送方需要写入换行并刷新缓冲，接收方才能用 `readLine()` 读取整行：

```java
writer.write("Java\n");
writer.flush();
String message = reader.readLine();
```

这段代码假定双方采用一致的编码和行分隔规则。接收方还应处理提前断开、超长消息和读取超时，不能把一次 `read()` 当作完整消息。

## 注意事项

- HTTP 的 4xx、5xx 状态不一定表现为 Java 异常，需要检查状态码。
- 阻塞式 Socket 应分别考虑连接超时和读取超时，资源使用完及时关闭。
- 对请求设置重试前，应判断操作是否可以安全重复执行。
- 公网请求使用 HTTPS 时应保持证书验证，并正确处理重定向和认证信息。
- UDP 不保证送达，重要数据需要应用层自行确认和重传。

## 练习

1. 为本地服务增加 `/missing` 路径并返回 404，修改客户端输出，让它根据状态码区分成功与失败。再把同步 `send` 改为 `sendAsync`，比较两种调用方式。
2. 为示例的 HTTP 响应增加 `GET /topic?name=Java` 的查询参数处理，让服务端按参数返回不同的内容。

## 参考资料

- [Tpoint Tech：Java Networking](https://www.tpointtech.com/java-networking)。
- [Java 21 API：HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html)。
- [Java 21 API：HttpServer](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html)。
