# JVM

JVM 是 Java Virtual Machine 的缩写。JVM 规范定义字节码、运行时数据区和执行规则；HotSpot 等实现负责把这些规则落实到具体操作系统和处理器上。

## 程序如何执行

```text
Java 源代码
    ↓ javac 编译
class 字节码
    ↓ 加载、连接、初始化
JVM 执行
    ↓
程序结果
```

字节码可以被解释执行。HotSpot 等实现还会通过即时编译器把部分代码编译为机器码。具体执行策略属于实现细节，不能把“Java 只解释执行”当作完整描述。

## 类加载

类进入运行环境后，通常会经历以下阶段：

| 阶段 | 作用 |
| --- | --- |
| 加载 | 获取类的二进制表示，建立运行时类型信息 |
| 连接：验证 | 检查字节码等内容是否符合规则 |
| 连接：准备 | 为相应静态字段分配存储并设置初始状态 |
| 连接：解析 | 将符号引用与实际目标关联；部分解析可以延后 |
| 初始化 | 执行类初始化逻辑，例如静态初始化块 |

HotSpot 内置三层类加载器：引导类加载器加载平台基础类，平台类加载器加载 JDK 模块，应用类加载器加载类路径中的程序类。类加载器通常先向父加载器请求，父加载器无法加载时才自行处理，这被称为双亲委派模型。自定义类加载器可以打破这一模型，例如插件容器。

类的运行时身份与类名和定义它的类加载器有关。同名类由不同类加载器定义时，可能是不同的类型。

## 运行时数据区

| 区域 | 是否按线程独立 | 主要内容 |
| --- | --- | --- |
| JVM 栈 | 是 | 方法调用的栈帧、局部变量和操作数栈等 |
| 程序计数器 | 是 | 当前线程执行位置的相关信息 |
| 本地方法栈 | 依实现支持 | 本地方法执行相关状态 |
| 堆 | 多线程共享 | JVM 为类实例和数组提供存储的区域 |
| 方法区 | 多线程共享 | 类结构、方法信息和运行时常量池等 |

每个方法调用对应一个栈帧，保存局部变量、操作数栈和指向常量池的引用等信息。方法返回后，栈帧随之销毁；栈深度过大时可能抛出 `StackOverflowError`。

方法区是规范中的概念。HotSpot 的元空间属于其实现方式，不能把两者简单视为所有 JVM 中都完全相同的物理区域。JIT 优化也可能改变对象分配等操作的实际实现。

## 示例：检查类并查看字节码

```java title="Main.java"
public class Main {
    static int add(int left, int right) {
        return left + right;
    }

    public static void main(String[] args) throws ClassNotFoundException {
        Class<?> loaded = Class.forName("Main");
        System.out.println("Class: " + loaded.getName());
        System.out.println("Same type: " + (loaded == Main.class));
        System.out.println("Result: " + add(18, 24));
    }
}
```

**输出：**

```text
Class: Main
Same type: true
Result: 42
```

编译后可以查看 `Main.class` 的字节码：

```sh
javap -c Main
```

`add` 方法对应的指令如下：

```text
static int add(int, int);
  Code:
     0: iload_0
     1: iload_1
     2: iadd
     3: ireturn
```

`iload_0` 和 `iload_1` 把两个整数参数压入操作数栈，`iadd` 弹出并相加后压回结果，`ireturn` 返回整数。`javap` 展示的是 class 文件中的指令，通常不是 JIT 最终生成的机器码。

## 垃圾回收

垃圾回收器识别不再被程序需要的对象，并在适当时机回收相应存储。对象是否仍可达，与局部变量是否还在作用域内不是简单的一一对应关系。

HotSpot 的常见收集器（具体行为和默认值随版本变化）：

| 收集器 | 特点 |
| --- | --- |
| G1 | 面向较大堆的低延迟收集器，JDK 21 默认 |
| ZGC | 极低暂停时间，支持非常大的堆 |
| Serial | 单线程，适合小内存环境 |
| Shenandoah | 低暂停，与 G1、ZGC 有不同取舍 |

`System.gc()` 不保证立即执行回收，也不能替代文件或连接的 `close()`。保留不再使用的对象引用仍然可能造成内存泄漏，例如持续增长且不清理的缓存。

## 常用诊断入口

| 工具或选项 | 用途 |
| --- | --- |
| `java -version` | 确认运行使用的 JDK |
| `javap -c` | 检查字节码 |
| `jcmd` | 向运行中的 JVM 请求诊断信息 |
| JFR | 记录运行事件，辅助分析耗时、分配和线程行为 |
| `-Xlog:gc*` | 在支持统一日志的 JVM 中观察垃圾回收信息 |

工具和选项的支持情况取决于具体 JDK。分析性能时先记录环境和可复现步骤，再收集证据，避免仅根据内存曲线或一次耗时就修改 JVM 参数。

## 注意事项

- 字节码目标版本需要与运行时支持范围匹配。
- 栈溢出、Java 堆内存不足和本地内存不足是不同问题。
- 垃圾回收不负责及时释放所有操作系统资源。
- 不同 JVM、垃圾回收器和 JDK 版本的实现细节可能不同。
- 类加载器层次和收集器行为是实现细节，跨 JDK 编写诊断脚本时应确认适用性。

## 练习

1. 为 `add` 增加一个乘法版本，分别编译并查看字节码。比较两个方法的共同结构与运算指令，说明源码、字节码和机器码分别属于哪个阶段。
2. 让 `main` 声明一个大数组并观察 `-Xlog:gc` 输出，记录你使用的 JDK 版本和收集器名称。

## 参考资料

- [Tpoint Tech：JVM Architecture](https://www.tpointtech.com/jvm-java-virtual-machine)。
- [Java 21 JVM 规范：The Structure of the Java Virtual Machine](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)。
