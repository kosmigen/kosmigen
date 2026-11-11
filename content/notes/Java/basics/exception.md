# 异常处理

异常用于表示执行过程中无法按当前路径继续完成的情况，例如输入格式错误、文件无法读取或网络请求失败。Java 使用异常对象携带错误类型、消息和调用栈信息。

## 异常体系

`Throwable` 是异常与错误的共同父类，主要分为 `Exception` 和 `Error` 两个分支。

| 类型 | 编译器要求 | 常见示例 |
| --- | --- | --- |
| 受检异常 | 必须捕获或通过 `throws` 声明 | `IOException`、`ClassNotFoundException` |
| 非受检异常 | 不强制捕获或声明 | `IllegalArgumentException`、`NullPointerException` |
| `Error` 及其子类 | 不强制捕获或声明，通常表示严重运行问题 | `OutOfMemoryError` |

`RuntimeException` 及其子类属于非受检异常。异常类分布在多个包中，例如 `IOException` 属于 `java.io`。

常见异常及触发场景：

| 异常 | 常见触发 |
| --- | --- |
| `ArithmeticException` | 整数除以零 |
| `NullPointerException` | 对 `null` 调用方法或访问字段 |
| `NumberFormatException` | 把非数字文本解析为数字 |
| `ArrayIndexOutOfBoundsException` | 数组下标越界 |
| `ClassCastException` | 不兼容的强制类型转换 |

浮点数除法不会抛出 `ArithmeticException`：`1.0 / 0` 得到 `Infinity`，`0.0 / 0.0` 得到 `NaN`。

## 基本语法

```java
try {
    // 可能失败的操作
} catch (具体异常类型 e) {
    // 处理已知失败
} finally {
    // 通常用于必须执行的清理操作
}
```

多个 `catch` 按从上到下的顺序匹配，较具体的异常类型应放在较一般的类型之前。多种异常需要相同处理时，可以使用多异常捕获；用 `|` 合并的类型之间不能有继承关系：

```java
catch (IOException | SQLException e) {
    // 两种异常按同一方式处理
}
```

| 关键字 | 作用 |
| --- | --- |
| `try` | 包围需要处理异常的操作 |
| `catch` | 捕获匹配类型的异常 |
| `finally` | 在退出 `try` 或 `catch` 时执行收尾操作 |
| `throw` | 抛出一个异常对象 |
| `throws` | 在方法声明上说明可能传播的异常类型 |

`finally` 在 `try` 正常完成、抛出异常或执行 `return` 时都会运行；如果过程中调用了 `System.exit` 或进程被强制终止，`finally` 不会执行。

## 示例：校验学习分钟数

```java title="Main.java"
public class Main {
    static int parseMinutes(String text) {
        int value = Integer.parseInt(text);
        if (value <= 0) {
            throw new IllegalArgumentException("minutes must be positive");
        }
        return value;
    }

    public static void main(String[] args) {
        String[] inputs = {"30", "abc", "-5"};
        for (String input : inputs) {
            try {
                System.out.println("Accepted: " + parseMinutes(input));
            } catch (NumberFormatException e) {
                System.out.println("Not a number: " + input);
            } catch (IllegalArgumentException e) {
                System.out.println("Invalid value: " + e.getMessage());
            }
        }
    }
}
```

**输出：**

```text
Accepted: 30
Not a number: abc
Invalid value: minutes must be positive
```

`NumberFormatException` 是 `IllegalArgumentException` 的子类。先捕获前者，才能为格式错误提供单独的提示；如果顺序颠倒，格式错误会落入更一般的分支。

## 资源清理

实现 `AutoCloseable` 的资源可以交给 try-with-resources 管理：

```java
try (BufferedReader reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
```

退出语句块时会调用资源的 `close()`。多个资源按声明顺序的逆序关闭。如果主要操作与关闭操作都失败，关闭异常通常作为 suppressed exception 保留。

## 自定义异常与异常传播

业务失败可以声明为自定义异常。是否使用受检异常，应根据调用方是否需要被强制要求处理这一情况决定：

```java
class InvalidMinutesException extends IllegalArgumentException {
    InvalidMinutesException(int minutes) {
        super("minutes out of range: " + minutes);
    }
}
```

包装异常时可以保留原始原因：

```java
throw new IllegalStateException("Unable to load study records", cause);
```

调用方能够恢复时就近处理；需要补充上下文时再包装并传播。仅记录日志后假装成功，会使后续代码难以判断操作是否完成。

## 示例：记录学习时长

```java title="Main.java"
class InvalidMinutesException extends IllegalArgumentException {
    InvalidMinutesException(int minutes) {
        super("minutes out of range: " + minutes);
    }
}

public class Main {
    static void record(int minutes) {
        if (minutes < 1 || minutes > 240) {
            throw new InvalidMinutesException(minutes);
        }
    }

    public static void main(String[] args) {
        int[] inputs = {30, 300, 45};
        int accepted = 0;
        for (int input : inputs) {
            try {
                record(input);
                accepted++;
            } catch (InvalidMinutesException e) {
                System.out.println("Rejected: " + e.getMessage());
            } finally {
                System.out.println("Checked " + input);
            }
        }
        System.out.println("Accepted: " + accepted);
    }
}
```

**输出：**

```text
Checked 30
Rejected: minutes out of range: 300
Checked 300
Checked 45
Accepted: 2
```

`record` 对超出 1—240 分钟的值抛出带有具体取值的自定义异常，调用方可以同时获得类型和上下文。无论 `try` 是否成功，`finally` 都会输出检查记录；`300` 被拒绝后 `accepted` 不增加，最终接受两条。

## 注意事项

- 避免空的 `catch`，也不要无差别捕获所有 `Throwable`。
- 不要在 `finally` 中使用 `return`，它可能覆盖原来的返回值或异常。
- `finally` 不是在任何情况下都保证执行，例如进程被强制终止。
- 捕获中断异常后，应合理传播中断，或恢复当前线程的中断标记。
- 多异常捕获中用 `|` 连接的类型不能互为父子类型，否则无法编译。
- 向调用方传播受检异常时，记得在方法声明中使用 `throws`。

## 练习

1. 为“校验学习分钟数”示例增加允许的最大时长 240 分钟，超过限制时抛出带有输入值的异常，并为 `"300"` 添加一条测试输入。
2. 给 `InvalidMinutesException` 增加一个携带原始原因 `Throwable cause` 的构造器，在包装其他异常时使用。

## 参考资料

- [Tpoint Tech：Exception Handling in Java](https://www.tpointtech.com/exception-handling-in-java)。
- [Java 21 语言规范：Exceptions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)。
