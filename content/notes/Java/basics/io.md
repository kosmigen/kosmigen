# 文件与 IO

IO 是 Input/Output 的缩写，表示程序与外部来源之间的数据输入和输出。文件、控制台、网络连接和内存中的字节数组都可以成为数据来源或目标。

Java 提供两套常用的文件与流 API：`java.io` 中的字节流、字符流及其包装类，以及 `java.nio.file` 中的 `Path`、`Files`。前者适合按顺序处理数据，后者提供更完整的路径和文件操作。本章先介绍 `Path` 与 `Files`，再按字节流、字符流、转换流、数据流、对象流和打印流的顺序展开，最后说明传统 `File` 对象。

## 路径、文件与数据流

| 概念 | 作用 |
| --- | --- |
| `Path` | 表示文件系统路径，可以指向尚不存在的文件 |
| `Files` | 提供读写、复制、移动和创建文件等静态方法 |
| `File` | 传统路径表示与文件属性操作，见下文 [File 对象](#file) |
| 字节流 | 通过 `InputStream`、`OutputStream` 等读写字节 |
| 字符流 | 通过 `Reader`、`Writer` 等处理字符与编码转换 |

流可以按数据单位、方向和职责分类：

| 分类 | 类型 | 说明 |
| --- | --- | --- |
| 数据单位 | 字节流 | 以字节为单位，适合图片、音频、压缩包等二进制数据 |
| 数据单位 | 字符流 | 以字符为单位，读写文本时负责编码与解码 |
| 方向 | 输入流、输出流 | 从数据源读入程序，或从程序写出到目标 |
| 职责 | 节点流 | 直接连接文件、数组、管道等数据源 |
| 职责 | 处理流 | 包装其他流，增加缓冲、编码转换、对象读写等能力 |

处理流通常接收另一个流作为构造参数。例如 `BufferedReader` 包装 `Reader`，`DataInputStream` 包装 `InputStream`。关闭最外层流时，通常会一并关闭被包装的流。

Java 程序启动时已经打开三个标准流：

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `System.in` | `InputStream` | 标准输入，通常对应键盘 |
| `System.out` | `PrintStream` | 标准输出 |
| `System.err` | `PrintStream` | 标准错误 |

`System.out` 和 `System.err` 都是 `PrintStream`，因此可以直接调用 `print`、`println` 和 `printf`。从控制台读取文本时，常用 `Scanner` 或 `BufferedReader(new InputStreamReader(System.in))`；本章重点放在文件与流本身。

`java.io` 提供传统 IO 类，`java.nio.file` 提供 `Path`、`Files` 等文件 API。

| 类别 | 抽象基类 | 常用实现或工厂 |
| --- | --- | --- |
| 字节输入 | `InputStream` | `FileInputStream`、`BufferedInputStream`、`ByteArrayInputStream`、`DataInputStream`、`ObjectInputStream` |
| 字节输出 | `OutputStream` | `FileOutputStream`、`BufferedOutputStream`、`ByteArrayOutputStream`、`DataOutputStream`、`ObjectOutputStream` |
| 字符输入 | `Reader` | `FileReader`、`InputStreamReader`、`BufferedReader`、`CharArrayReader`、`StringReader` |
| 字符输出 | `Writer` | `FileWriter`、`OutputStreamWriter`、`BufferedWriter`、`PrintWriter`、`CharArrayWriter`、`StringWriter` |

`Files.newInputStream`、`Files.newBufferedReader` 等方法也是创建流的常用入口，底层仍然返回上述类型。

## 路径 Path

`Path` 表示文件系统路径，只创建路径对象，不创建文件：

| 方法 | 作用 |
| --- | --- |
| `Path.of(...)` | 用路径片段创建 `Path` |
| `path.getParent()` | 父路径；根路径的父路径为 `null` |
| `path.getFileName()` | 路径的最后一段名称 |
| `path.resolve(other)` | 在当前路径后拼接另一段路径 |
| `path.toAbsolutePath()` | 转换为绝对路径 |

多个片段可以用逗号传入 `Path.of`，也可以使用 `resolve` 逐步拼接，避免手工拼接分隔符带来的平台差异。

## 基本语法

```java
Path path = Path.of("notes", "plan.txt");
Files.writeString(path, "Learn Java", StandardCharsets.UTF_8);
String text = Files.readString(path, StandardCharsets.UTF_8);
```

`Path.of` 只创建路径对象。写文件前需要保证父目录存在；必要时可以调用 `Files.createDirectories(path.getParent())`。`writeString` 的默认行为会创建文件，或覆盖已有文件内容。

## 示例：保存并读取学习记录

下面在临时目录中完成读写，并在结束后清理本例创建的文件。

```java title="Main.java"
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-io-");
        Path file = directory.resolve("plan.txt");
        try {
            Files.writeString(file, "Java\nIO\n", StandardCharsets.UTF_8);
            String content = Files.readString(file, StandardCharsets.UTF_8);
            System.out.println("Content:");
            System.out.print(content);
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Content:
Java
IO
```

`resolve` 在目录路径后拼接文件名。显式指定 UTF-8，可以使写入和读取采用一致的编码。`finally` 清理临时文件，避免每次运行留下测试数据。

## 字节流

字节流以 `byte` 为单位读写数据，不进行字符编码转换。图片、音频、视频、压缩包和序列化后的对象都应按字节处理。

### InputStream 与 OutputStream

`InputStream` 是所有字节输入流的抽象基类：

| 方法 | 作用 |
| --- | --- |
| `int read()` | 读取一个字节，返回 0 到 255；到达末尾返回 -1 |
| `int read(byte[] b)` | 读取若干字节到数组，返回实际读取的字节数；末尾返回 -1 |
| `int read(byte[] b, int off, int len)` | 从数组的 `off` 位置开始最多写入 `len` 个字节 |
| `long skip(long n)` | 跳过并丢弃最多 `n` 个字节 |
| `int available()` | 估计无需阻塞即可读取的字节数，不能当作文件总长度 |
| `long transferTo(OutputStream out)` | 将剩余字节复制到另一个输出流 |
| `void close()` | 关闭流并释放资源 |

`OutputStream` 是所有字节输出流的抽象基类：

| 方法 | 作用 |
| --- | --- |
| `void write(int b)` | 写入参数的低 8 位 |
| `void write(byte[] b)` | 写入整个字节数组 |
| `void write(byte[] b, int off, int len)` | 写入数组中从 `off` 开始的 `len` 个字节 |
| `void flush()` | 将缓冲区中的内容推送到目标 |
| `void close()` | 关闭流；多数实现会先刷新缓冲区 |

`read()` 返回 `int` 而不是 `byte`，是为了用 `-1` 表示流结束。读取到的值需要转换为 `byte` 时，只保留低 8 位。`read(byte[])` 不一定填满数组，返回值才表示本次实际读取的字节数。

### FileInputStream 与 FileOutputStream

`FileInputStream` 从文件读取字节，`FileOutputStream` 向文件写出字节。

| 构造器 | 作用 |
| --- | --- |
| `FileInputStream(String name)` | 按路径名打开文件 |
| `FileInputStream(File file)` | 按 `File` 对象打开文件 |
| `FileInputStream(FileDescriptor fdObj)` | 使用已有的文件描述符 |
| `FileOutputStream(String name)` | 创建或覆盖文件后写入 |
| `FileOutputStream(String name, boolean append)` | `append` 为 `true` 时在文件末尾追加 |
| `FileOutputStream(File file)` | 按 `File` 对象创建或覆盖文件 |
| `FileOutputStream(File file, boolean append)` | 按 `File` 对象决定是否追加 |

文件不存在、路径是目录或没有访问权限时，构造器会抛出 `FileNotFoundException`。`FileOutputStream` 默认会截断已有文件；需要保留原内容时必须使用追加模式。

### 示例：复制文件

下面用字节数组作为缓冲区，把源文件逐块复制到目标文件：

```java title="Main.java"
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-byte-io-");
        Path source = directory.resolve("source.txt");
        Path target = directory.resolve("target.txt");
        try {
            try (OutputStream out = new FileOutputStream(source.toFile())) {
                out.write("Java IO\n字节流\n".getBytes(StandardCharsets.UTF_8));
            }

            try (InputStream in = new FileInputStream(source.toFile());
                 OutputStream out = new FileOutputStream(target.toFile())) {
                byte[] buffer = new byte[8];
                int count;
                while ((count = in.read(buffer)) != -1) {
                    out.write(buffer, 0, count);
                }
            }

            System.out.println("Copied bytes: " + Files.size(target));
            System.out.println("Content:");
            System.out.print(Files.readString(target, StandardCharsets.UTF_8));
        } finally {
            Files.deleteIfExists(source);
            Files.deleteIfExists(target);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Copied bytes: 18
Content:
Java IO
字节流
```

`read(buffer)` 每次最多读取 `buffer.length` 个字节，返回值是实际读取的数量。最后一次可能读不满数组，因此写出时使用 `out.write(buffer, 0, count)`，而不是写出整个数组。`try-with-resources` 会在代码块结束时关闭两个流。复制过程不解析文本内容，因此同样适用于图片等二进制文件；最后的 `Files.readString` 只用于核对复制结果。

### BufferedInputStream 与 BufferedOutputStream

`BufferedInputStream` 和 `BufferedOutputStream` 为其他字节流增加缓冲区：

| 构造器 | 作用 |
| --- | --- |
| `BufferedInputStream(InputStream in)` | 使用默认缓冲区包装输入流 |
| `BufferedInputStream(InputStream in, int size)` | 使用指定大小的缓冲区 |
| `BufferedOutputStream(OutputStream out)` | 使用默认缓冲区包装输出流 |
| `BufferedOutputStream(OutputStream out, int size)` | 使用指定大小的缓冲区 |

默认缓冲区大小为 8192 字节。缓冲区把多次小规模读写合并为较少的系统调用，适合文件复制、网络传输等场景。包装后的流仍然按字节读写，缓冲对调用方透明：

```java
try (InputStream in = new BufferedInputStream(new FileInputStream(source.toFile()));
     OutputStream out = new BufferedOutputStream(new FileOutputStream(target.toFile()))) {
    byte[] buffer = new byte[8192];
    int count;
    while ((count = in.read(buffer)) != -1) {
        out.write(buffer, 0, count);
    }
}
```

`BufferedOutputStream` 只有在缓冲区满、调用 `flush()` 或关闭流时才会把内容真正写出。需要立即看到写入结果时，应显式调用 `flush()`；不要把 `flush()` 当作关闭，资源仍要由 `close()` 释放。

### RandomAccessFile

`RandomAccessFile` 不属于 `InputStream` 或 `OutputStream` 体系，而是通过文件指针在文件的任意位置读写。它实现了 `DataInput` 和 `DataOutput`，因此也提供读写基本类型的方法。

| 构造器 | 作用 |
| --- | --- |
| `RandomAccessFile(File file, String mode)` | 按 `File` 对象打开文件 |
| `RandomAccessFile(String name, String mode)` | 按路径名打开文件 |

`mode` 常用 `"r"`（只读）和 `"rw"`（读写；文件不存在时创建）。`seek(long pos)` 把文件指针移动到指定位置，`getFilePointer()` 返回当前位置，`length()` 返回文件长度。指针在每次读写后自动前移；在文件末尾之外读取会抛出 `EOFException`。

### 示例：从指定位置读写文件

```java title="Main.java"
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-random-");
        Path file = directory.resolve("records.bin");
        try {
            try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "rw")) {
                raf.write("AAAA".getBytes(StandardCharsets.UTF_8));
                raf.write("BBBB".getBytes(StandardCharsets.UTF_8));

                raf.seek(0);
                raf.write("JAVA".getBytes(StandardCharsets.UTF_8));

                raf.seek(4);
                byte[] data = new byte[4];
                raf.readFully(data);
                System.out.println("Second block: " + new String(data, StandardCharsets.UTF_8));
                System.out.println("Length: " + raf.length());
            }
            System.out.println("File content: " + Files.readString(file, StandardCharsets.UTF_8));
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Second block: BBBB
Length: 8
File content: JAVABBBB
```

先写入 8 个字节，`seek(0)` 把指针移回开头并覆盖前 4 个字节为 `JAVA`，因此文件内容变为 `JAVABBBB`。再次 `seek(4)` 后读取 4 个字节，得到第二块 `BBBB`。随机访问适合固定长度记录、索引文件等场景；文本替换时要注意新旧内容的长度关系，覆盖不足会留下残余字节，覆盖过长会改写后续内容。

### ByteArrayInputStream 与 ByteArrayOutputStream

字节数组流把内存中的 `byte[]` 当作数据源或目标，不需要文件系统：

| 类 | 常用方法 |
| --- | --- |
| `ByteArrayInputStream` | `read()`、`read(byte[], int, int)`、`available()`、`skip(long)`、`mark(int)`、`reset()` |
| `ByteArrayOutputStream` | `write(int)`、`write(byte[], int, int)`、`toByteArray()`、`toString(Charset)`、`size()`、`reset()` |

`ByteArrayInputStream` 的构造器可以接收整个数组，也可以只读取数组的一段：`ByteArrayInputStream(byte[] buf)`、`ByteArrayInputStream(byte[] buf, int offset, int length)`。`ByteArrayOutputStream` 可以按默认大小创建，也可以指定初始容量。关闭这两个流通常不会释放需要手动管理的系统资源，但它们仍实现了 `Closeable`，可以和其他流一样使用 `try-with-resources`。

### 示例：在内存中读写字节

```java title="Main.java"
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write("Hello".getBytes(StandardCharsets.UTF_8));
        out.write(',');
        out.write("Java".getBytes(StandardCharsets.UTF_8));

        byte[] data = out.toByteArray();
        System.out.println("Size: " + data.length);

        ByteArrayInputStream in = new ByteArrayInputStream(data);
        byte[] buffer = new byte[5];
        int count;
        while ((count = in.read(buffer)) != -1) {
            System.out.print(new String(buffer, 0, count, StandardCharsets.UTF_8));
        }
        System.out.println();
    }
}
```

**输出：**

```text
Size: 10
Hello,Java
```

`ByteArrayOutputStream` 会随着写入自动扩展内部数组，`toByteArray()` 返回当前内容的副本。`ByteArrayInputStream` 从同一个数组读取，`read(buffer)` 返回实际读取的字节数；循环必须使用 `count` 构造字符串，不能假定每次都能填满数组。

## 字符流

字符流以字符为单位读写文本，并在字节与字符之间进行编码转换。`Reader` 和 `Writer` 是字符流的抽象基类：

| 类 | 常用方法 |
| --- | --- |
| `Reader` | `read()`、`read(char[])`、`read(char[], int, int)`、`skip(long)`、`ready()`、`mark(int)`、`reset()`、`close()` |
| `Writer` | `write(int)`、`write(char[])`、`write(char[], int, int)`、`write(String)`、`write(String, int, int)`、`append(CharSequence)`、`flush()`、`close()` |

`Reader.read()` 返回一个字符的 `int` 值，到达末尾时返回 -1；`Writer.write(int)` 写入参数的低 16 位。字符流的具体实现负责选择编码，读写双方必须使用一致的字符集，否则会出现乱码。

### FileReader 与 FileWriter

| 构造器 | 作用 |
| --- | --- |
| `FileReader(String fileName)` | 按路径名打开文件 |
| `FileReader(File file)` | 按 `File` 对象打开文件 |
| `FileReader(String fileName, Charset charset)` | 使用指定编码 |
| `FileReader(File file, Charset charset)` | 使用指定编码 |
| `FileWriter(String fileName)` | 创建或覆盖文件 |
| `FileWriter(String fileName, boolean append)` | 决定是否追加 |
| `FileWriter(File file)` | 创建或覆盖文件 |
| `FileWriter(File file, boolean append)` | 决定是否追加 |
| `FileWriter(String fileName, Charset charset, boolean append)` | 指定编码和追加方式 |
| `FileWriter(File file, Charset charset, boolean append)` | 指定编码和追加方式 |

不带 `Charset` 的构造器使用平台默认编码。同一份文本在不同平台的默认编码可能不同，读写双方不一致时会出现乱码；需要稳定行为时应显式指定编码。

`FileReader` 和 `FileWriter` 是 `InputStreamReader`、`OutputStreamWriter` 的便捷子类。它们适合简单的本地文本文件；需要把字节流转换为字符流，或在转换过程中指定更完整的参数时，直接使用转换流。

字符数组流和字符串流把内存中的字符数据当作数据源或目标：`CharArrayReader`、`CharArrayWriter`、`StringReader`、`StringWriter`。它们不接触文件，适合测试字符处理逻辑，用法与字节数组流对称。

### InputStreamReader 与 OutputStreamWriter

`InputStreamReader` 把字节输入流解码为字符流，`OutputStreamWriter` 把字符流编码为字节输出流：

| 类 | 构造器 |
| --- | --- |
| `InputStreamReader` | `(InputStream in)`、`(InputStream in, Charset cs)`、`(InputStream in, CharsetDecoder dec)`、`(InputStream in, String charsetName)` |
| `OutputStreamWriter` | `(OutputStream out)`、`(OutputStream out, Charset cs)`、`(OutputStream out, CharsetEncoder enc)`、`(OutputStream out, String charsetName)` |

两者都提供 `getEncoding()`，可以查询当前使用的编码名称。没有指定编码时使用平台默认值。转换流常与其他处理流组合，例如 `BufferedReader` 包装 `InputStreamReader`，再包装 `FileInputStream`。

### BufferedReader 与 BufferedWriter

`BufferedReader` 按字符缓冲输入，并提供 `readLine()`；`BufferedWriter` 按字符缓冲输出，并提供 `newLine()`：

| 类 | 常用方法 |
| --- | --- |
| `BufferedReader` | `read()`、`read(char[], int, int)`、`readLine()`、`lines()`、`ready()`、`skip(long)`、`mark(int)`、`reset()` |
| `BufferedWriter` | `write(int)`、`write(char[], int, int)`、`write(String, int, int)`、`newLine()`、`flush()` |

`readLine()` 返回一行文本，不包含行结束符；到达末尾时返回 `null`。空行的返回值是空字符串，不能用来判断结束。`newLine()` 写入当前平台的行分隔符，读取时 `readLine()` 能识别常见的换行形式。

`Files.newBufferedReader(path, charset)` 和 `Files.newBufferedWriter(path, charset)` 是创建带缓冲字符流的便捷方法：

```java
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}
```

### 示例：按 UTF-8 读写课程记录

```java title="Main.java"
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-char-io-");
        Path file = directory.resolve("courses.txt");
        try {
            try (BufferedWriter writer = new BufferedWriter(
                    new OutputStreamWriter(new FileOutputStream(file.toFile()), StandardCharsets.UTF_8))) {
                writer.write("Java");
                writer.newLine();
                writer.write("IO");
                writer.newLine();
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(new FileInputStream(file.toFile()), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("Line: " + line);
                }
            }
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Line: Java
Line: IO
```

写入端的包装顺序是文件字节流、编码转换流和缓冲字符流：`FileOutputStream` 负责写字节，`OutputStreamWriter` 负责按 UTF-8 编码字符，`BufferedWriter` 负责减少实际写出次数。读取端按相反顺序组合，`InputStreamReader` 把字节解码为字符。关闭最外层的 `BufferedWriter` 或 `BufferedReader` 时，内层流也会被关闭。

## 数据流与对象流

数据流读写 Java 基本类型和字符串的二进制表示；对象流在数据流的基础上读写整个对象。

### DataInputStream 与 DataOutputStream

`DataOutputStream` 把基本类型写成固定长度的二进制形式，`DataInputStream` 按相同类型读回：

| `DataOutputStream` | `DataInputStream` |
| --- | --- |
| `writeBoolean(boolean)` | `readBoolean()` |
| `writeByte(int)` | `readByte()`、`readUnsignedByte()` |
| `writeShort(int)` | `readShort()`、`readUnsignedShort()` |
| `writeChar(int)` | `readChar()` |
| `writeInt(int)` | `readInt()` |
| `writeLong(long)` | `readLong()` |
| `writeFloat(float)` | `readFloat()` |
| `writeDouble(double)` | `readDouble()` |
| `writeUTF(String)` | `readUTF()` |
| `write(byte[])`、`flush()`、`size()` | `readFully(byte[])`、`skipBytes(int)` |

`writeUTF` 使用修改后的 UTF-8 编码，适合长度有限的字符串；它不等于通用的文本编码格式。数据流按大端顺序写入多字节值，写入和读取的类型顺序必须完全一致，否则会把字节解释成错误的值。

### 示例：读写二进制记录

```java title="Main.java"
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-data-io-");
        Path file = directory.resolve("record.bin");
        try {
            try (DataOutputStream out = new DataOutputStream(
                    new BufferedOutputStream(new FileOutputStream(file.toFile())))) {
                out.writeInt(2026);
                out.writeUTF("Java IO");
                out.writeDouble(95.5);
                out.writeBoolean(true);
            }

            try (DataInputStream in = new DataInputStream(
                    new BufferedInputStream(new FileInputStream(file.toFile())))) {
                System.out.println("Year: " + in.readInt());
                System.out.println("Topic: " + in.readUTF());
                System.out.println("Score: " + in.readDouble());
                System.out.println("Passed: " + in.readBoolean());
            }
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Year: 2026
Topic: Java IO
Score: 95.5
Passed: true
```

写入和读取使用完全相同的类型顺序。`writeUTF` 会先写入字符串长度，再写入修改后的 UTF-8 字节，因此 `readUTF` 能准确还原字符串边界。这个文件是二进制格式，用文本编辑器打开通常无法直接阅读。

### 对象序列化

序列化把对象的状态转换为字节流，反序列化再把字节流恢复为对象。Java 通过 `ObjectOutputStream.writeObject` 写出对象，通过 `ObjectInputStream.readObject` 读回对象。

参与序列化的类必须实现 `java.io.Serializable` 接口。这个接口没有方法，只起到标记作用。数组或集合中的每个元素也必须可序列化；否则会抛出 `NotSerializableException`。

| 规则 | 说明 |
| --- | --- |
| `static` 字段 | 属于类而不是对象，不参与序列化 |
| `transient` 字段 | 不参与序列化，反序列化后恢复为默认值 |
| 引用字段 | 引用的对象也必须实现 `Serializable` |
| `serialVersionUID` | 建议显式声明，用于检查序列化版本是否兼容 |
| 构造器与初始化 | 可序列化类自身在反序列化时不会执行构造器和字段初始化器 |

没有显式声明 `serialVersionUID` 时，运行时会根据类结构生成一个值。类结构变化后该值可能改变，反序列化旧数据时会抛出 `InvalidClassException`。需要长期保存或跨版本传输时，应声明：

```java
private static final long serialVersionUID = 1L;
```

需要自定义序列化格式时，可以实现 `Externalizable` 接口，并提供 `writeExternal(ObjectOutput)` 与 `readExternal(ObjectInput)`。`Externalizable` 继承自 `Serializable`，反序列化时还需要可访问的无参构造器。

### 示例：序列化课程对象

```java title="Main.java"
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static class Course implements Serializable {
        private static final long serialVersionUID = 1L;

        private final String name;
        private final int minutes;
        private transient String note = "temporary";

        Course(String name, int minutes) {
            this.name = name;
            this.minutes = minutes;
        }

        @Override
        public String toString() {
            return name + " (" + minutes + " minutes, note=" + note + ")";
        }
    }

    public static void main(String[] args) throws IOException, ClassNotFoundException {
        Path directory = Files.createTempDirectory("java-object-io-");
        Path file = directory.resolve("course.bin");
        try {
            Course saved = new Course("Java IO", 90);
            try (ObjectOutputStream out = new ObjectOutputStream(
                    new BufferedOutputStream(new FileOutputStream(file.toFile())))) {
                out.writeObject(saved);
            }

            Course loaded;
            try (ObjectInputStream in = new ObjectInputStream(
                    new BufferedInputStream(new FileInputStream(file.toFile())))) {
                loaded = (Course) in.readObject();
            }
            System.out.println(loaded);
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Java IO (90 minutes, note=null)
```

`writeObject` 写出对象的类信息和字段状态，`readObject` 返回 `Object`，需要强制转换为实际类型。`note` 被标记为 `transient`，不进入序列化数据，反序列化后为 `null`。`name` 和 `minutes` 是普通实例字段，能够恢复。`serialVersionUID` 帮助读取方确认类的序列化版本；类结构变化时，不应随意修改这个值。

## 打印流 PrintStream

`PrintStream` 把格式化后的文本写到字节输出流，`System.out` 和 `System.err` 都是它的实例。它提供 `print`、`println`、`printf` 和 `format` 等方法，写入失败时不会抛出 `IOException`，而是设置内部错误标记，可以通过 `checkError()` 查询。

| 构造器 | 作用 |
| --- | --- |
| `PrintStream(OutputStream out)` | 包装字节输出流 |
| `PrintStream(OutputStream out, boolean autoFlush)` | 指定是否自动刷新 |
| `PrintStream(OutputStream out, boolean autoFlush, Charset charset)` | 指定编码 |
| `PrintStream(String fileName)`、`PrintStream(File file)` | 直接写入文件，使用平台默认编码 |

```java
System.out.printf("Topic: %s, minutes: %d%n", "Java IO", 90);

try (PrintStream out = new PrintStream(
        Files.newOutputStream(path), true, StandardCharsets.UTF_8)) {
    out.printf("Score: %.1f%n", 95.5);
}
```

`printf` 的格式规则与 `String.format` 相同，`%n` 表示平台行分隔符。`autoFlush` 为 `true` 时，调用 `println`、`printf` 或写入换行后会刷新缓冲区。需要处理字符编码和更细粒度的错误时，也可以使用 `PrintWriter`；它面向 `Writer`，提供类似的方法。

## 常见操作

| 操作 | API 示例 |
| --- | --- |
| 创建目录 | `Files.createDirectories(directory)` |
| 复制文件 | `Files.copy(source, target)` |
| 移动文件 | `Files.move(source, target)` |
| 读取字节 | `Files.readAllBytes(path)` |
| 追加文本 | `Files.writeString(path, text, UTF_8, CREATE, APPEND)` |
| 按行读取 | `Files.lines(path, UTF_8)` |
| 创建缓冲字符流 | `Files.newBufferedReader(path, UTF_8)`、`Files.newBufferedWriter(path, UTF_8)` |
| 删除文件 | `Files.delete(path)`、`Files.deleteIfExists(path)` |

上表中的 `UTF_8`、`CREATE`、`APPEND` 需要对应的导入或完整限定名。复制、移动和覆盖行为应根据需要选择选项。

## 示例：追加课程记录并逐行读取

```java title="Main.java"
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-io-");
        Path file = directory.resolve("log.txt");
        try {
            Files.writeString(file, "Java\n", StandardCharsets.UTF_8);
            Files.writeString(file, "IO\n", StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

            try (Stream<String> lines = Files.lines(file, StandardCharsets.UTF_8)) {
                lines.forEach(line -> System.out.println("Line: " + line));
            }

            System.out.println("Files in directory:");
            try (Stream<Path> entries = Files.list(directory)) {
                entries.forEach(entry -> System.out.println("  " + entry.getFileName()));
            }
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Line: Java
Line: IO
Files in directory:
  log.txt
```

第一次写入创建文件，第二次写入使用 `APPEND` 保留原有内容。`Files.lines` 返回一个需要关闭的流，逐行处理可以避免把整个文件读入内存；`Files.list` 列出目录的直接子项，同样需要关闭。

## File 对象

`java.io.File` 表示文件或目录的路径名称。它可以查询属性、创建或删除文件、列出目录内容，但不负责直接读取和写入文件中的数据。

### 创建 File 对象

**语法：**

```java
File file = new File("plan.txt");
File child = new File("notes", "plan.txt");
File nested = new File(new File("notes"), "plan.txt");
File fromUri = new File(URI.create("file:///tmp/plan.txt"));
```

构造器只保存路径信息，路径指向的文件可以尚未存在。实际创建普通文件可以使用 `createNewFile()`，创建目录可以使用 `mkdir()` 或 `mkdirs()`，后者会创建不存在的父目录。

`File.separator` 和 `File.pathSeparator` 提供当前平台的路径分隔符。手工拼接路径时可以使用它们，但更推荐构造器或多参数形式。

### 常用方法

| 方法 | 作用 |
| --- | --- |
| `getName()` | 获取路径最后一部分的名称 |
| `getParent()` | 获取父路径，可能为 `null` |
| `getPath()` | 获取构造对象时表示的路径 |
| `getAbsolutePath()` | 获取绝对路径形式 |
| `exists()` | 检查路径当前是否存在 |
| `isFile()`、`isDirectory()` | 检查是否为普通文件或目录 |
| `isHidden()` | 检查是否为隐藏文件，平台含义可能不同 |
| `canRead()`、`canWrite()`、`canExecute()` | 查询访问权限，平台含义可能不同 |
| `length()` | 获取文件长度，通常按字节计 |
| `lastModified()` | 获取最后修改时间，通常按毫秒计 |
| `createNewFile()` | 文件不存在时创建空文件，返回是否新建成功 |
| `mkdir()`、`mkdirs()` | 创建目录；`mkdirs()` 同时创建不存在的父目录 |
| `list()`、`listFiles()` | 获取目录中的直接子项 |
| `renameTo(File)` | 重命名或移动，是否成功取决于文件系统 |
| `delete()` | 尝试删除文件或空目录，返回是否成功 |
| `toPath()` | 转换为 `Path`，便于配合 `Files` 使用 |

`listFiles()` 不会递归遍历所有子目录，无法列出时可能返回 `null`。`length()` 的结果也不能用于可靠判断文件是否存在。

### 示例：路径对象与真实文件

```java title="Main.java"
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("java-file-");
        File file = new File(directory.toFile(), "plan.txt");
        try {
            System.out.println("Before: " + file.exists());
            System.out.println("Created: " + file.createNewFile());
            System.out.println("Regular file: " + file.isFile());
            System.out.println("Name: " + file.getName());
        } finally {
            Files.deleteIfExists(file.toPath());
            Files.deleteIfExists(directory);
        }
    }
}
```

**输出：**

```text
Before: false
Created: true
Regular file: true
Name: plan.txt
```

调用构造器后文件尚未创建，所以首次 `exists()` 返回 `false`。`createNewFile()` 执行后，路径才对应一个真实文件。

### 目录与 mkdirs

`mkdirs()` 会创建路径上所有不存在的目录：

```java
File notes = new File(directory.toFile(), "notes/2026");
boolean created = notes.mkdirs(); // 同时创建 notes 和 2026
System.out.println(notes.isDirectory()); // true
```

目录创建失败时方法返回 `false`，不会抛出异常。需要明确失败原因时，可以使用 `Files.createDirectories`，它在失败时抛出带具体原因的异常。

### File 与 Path、Files

`File` 在旧代码和许多第三方 API 中仍然常见。编写新的文件操作时，可以使用 `Path` 表示路径、`Files` 执行操作，通过异常获得更具体的失败原因。

```java
Path path = file.toPath();
File legacyFile = path.toFile();
```

`Path.toFile()` 主要适用于默认文件系统的路径，其他文件系统提供者的路径可能不支持这种转换。

## 注意事项

- 相对路径基于进程的工作目录，通常与源文件所在目录不同。
- 文本使用字符编码，图片、压缩包等二进制数据应按字节处理。
- 字节流和字符流不要混用同一个数据源；需要转换时使用 `InputStreamReader` 或 `OutputStreamWriter`。
- 读写文本时显式指定字符集，避免依赖平台默认编码。
- 文件、目录遍历流和网络资源应及时关闭，优先采用 try-with-resources。
- 包装流关闭最外层即可，内层流通常会被一并关闭；不要在关闭后再使用内层流。
- `read()` 返回 -1 表示流结束；`read(byte[])` 或 `read(char[])` 应使用返回值判断实际读取数量。
- `BufferedOutputStream`、`BufferedWriter` 需要 `flush()` 或 `close()` 才会把缓冲区内容写出。
- 文件存在性检查与后续操作之间可能发生变化，操作本身的异常仍需处理。
- `Files.lines`、`Files.list`、`Files.walk` 返回的流如果不关闭，可能长时间占用文件句柄。
- `new File(...)` 不会创建文件，`mkdirs()` 也不会创建普通文件。
- `delete()` 返回 `false` 时需要处理失败；需要明确错误原因时可以使用 `Files.delete`。
- 绝对路径不等于规范路径，也不意味着路径一定存在。
- 不要依赖 `listFiles()` 的返回顺序；需要顺序时应自行排序。
- `renameTo` 在不同文件系统之间的行为不保证成功，跨目录移动优先使用 `Files.move`。
- 数据流写入和读取的类型顺序必须一致，否则会把字节解释成错误的值。
- `static` 和 `transient` 字段不会进入序列化数据；引用字段引用的对象也必须可序列化。
- 序列化数据包含类信息，不应反序列化来源不可信的数据。

## 练习

1. 修改“复制文件”示例，把缓冲区改为 1 字节和 1024 字节，统计循环执行次数，比较两种缓冲区大小对读写次数的影响。
2. 用 `ByteArrayOutputStream` 依次写入多段 UTF-8 文本，再用 `ByteArrayInputStream` 读回并输出。说明为什么这个示例不需要清理临时文件。
3. 把“按 UTF-8 读写课程记录”示例改写为 `Files.newBufferedWriter` 与 `Files.newBufferedReader`，比较两种写法的包装层次。
4. 在“读写二进制记录”示例中增加一个 `writeLong` 字段，并在读取端按相同顺序读取；再故意交换两个读取步骤，观察输出并解释原因。
5. 在“从指定位置读写文件”示例中，把 `seek(4)` 后写入的内容改为长度不同的字符串，观察文件长度和后续字节的变化；说明覆盖写与插入写的区别。
6. 给“序列化课程对象”示例增加一个 `static` 字段和一个普通字段，运行后检查反序列化结果，说明哪些值被保留、哪些值被重置。
7. 在临时目录中创建两个文件，使用 `listFiles()` 列出名称并排序输出。处理返回值为 `null` 的情况，结束后只清理本例创建的文件和目录。

## 参考资料

- [Tpoint Tech：Java I/O Tutorial](https://www.tpointtech.com/java-io)。
- [Tpoint Tech：Java File Class](https://www.tpointtech.com/java-file-class)。
- [Tpoint Tech：Java FileInputStream Class](https://www.tpointtech.com/java-fileinputstream-class)。
- [Tpoint Tech：Java FileOutputStream Class](https://www.tpointtech.com/java-fileoutputstream-class)。
- [Tpoint Tech：Java BufferedReader Class](https://www.tpointtech.com/java-bufferedreader-class)。
- [Tpoint Tech：Java BufferedWriter Class](https://www.tpointtech.com/java-bufferedwriter-class)。
- [Tpoint Tech：Java RandomAccessFile Class](https://www.tpointtech.com/java-randomaccessfile-class)。
- [Tpoint Tech：Serialization and Deserialization in Java](https://www.tpointtech.com/serialization-in-java)。
- [Java 21 API：InputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html)。
- [Java 21 API：OutputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/OutputStream.html)。
- [Java 21 API：Reader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Reader.html)。
- [Java 21 API：Writer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Writer.html)。
- [Java 21 API：Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html)。
- [Java 21 API：Serializable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)。
