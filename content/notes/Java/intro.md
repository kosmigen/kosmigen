---
title: Java
description: Java 的由来、发展历史、第一个程序与编译运行过程、JDK/JRE/JVM 的关系和关键字速查，以 JDK 21 为示例基准。
---

# Java

Java 是一种静态类型、以类和对象为主要组织方式的通用编程语言。学习 Java，既需要掌握语言语法，也需要理解标准库和 Java 虚拟机提供的运行环境。

本栏目以 **JDK 21** 为示例基准，使用正式发布的语言特性。每个专题先解释概念，再通过语法、示例和运行结果说明用法。

教程结构、主要特性、C++ 对比、数据类型、Unicode 与运算符等语言层面的概念见 [Java 概述](overview.md)。

## Java 的由来

Java 源于 Sun Microsystems 在 1991 年启动的 Green 项目，James Gosling 是主要设计者之一。早期语言名为 Oak，最初面向消费电子设备；后来团队将重点转向互联网应用，并在 1995 年以 Java 的名称公开发布。JDK 1.0 于 1996 年发布。

Java 的一个重要设计目标是让程序能够跨平台运行。编译器先把源代码转换为字节码，再由目标平台上的 Java 虚拟机执行。实际部署时，仍需考虑 JDK 版本、原生依赖、文件路径和操作系统差异。

## 发展历史

| 阶段 | 主要变化 |
| --- | --- |
| 1991—1996 | 从 Green 项目、Oak 发展为 Java，发布 JDK 1.0 |
| Java 5，2004 年 | 引入泛型、枚举、注解、自动装箱等特性 |
| Java 8，2014 年 | 引入 Lambda、Stream 和新的日期时间 API |
| Java 9，2017 年 | 引入模块系统，进一步组织平台和应用的依赖关系 |
| Java 11、17 | 持续改进语言、标准库与运行时，是理解现代 Java 演进的重要节点 |
| Java 21，2023 年 | 虚拟线程、记录模式、模式匹配 switch 等特性正式发布 |

学习时需要区分语言版本和具体的 JDK 发行版。使用同一语言版本的不同发行版，也可能有不同的支持周期和许可条件。

## 第一个 Java 程序

保存为 `Main.java`：

```java title="Main.java"
public class Main {
    public static void main(String[] args) {
        System.out.println("Start learning Java.");
    }
}
```

编译并运行：

```sh
javac -encoding UTF-8 Main.java
java Main
```

**输出：**

```text
Start learning Java.
```

程序各组成部分的含义：

| 组成部分 | 含义 |
| --- | --- |
| `class` | 声明一个类 |
| `public` | 访问修饰符，表示对外可见 |
| `static` | 静态方法，不需要创建对象即可调用 |
| `void` | 方法不返回值 |
| `main` | 入口方法名，由 JVM 调用 |
| `String[] args` | 命令行参数 |
| `System.out.println` | 输出一行文本：`System` 是类，`out` 是 `PrintStream` 类型的静态字段，`println` 是输出方法 |

### 编译与运行发生了什么

编译时，`javac` 把源代码转换为 `.class` 字节码文件，编译器不与操作系统直接交互。运行时按以下步骤处理：

```text
类加载器加载类文件
    ↓
字节码校验器检查代码是否违反访问规则
    ↓
解释器执行字节码；HotSpot 等实现还会用 JIT 编译热点代码
```

字节码与执行细节的进一步说明见[进阶：JVM](advanced/jvm/index.md)。

### 源文件命名

- `public` 类的源文件名必须与类名一致：`public class Main` 必须保存为 `Main.java`。
- 非 `public` 类可以保存在不同名称的文件里：编译用文件名，运行用类名。
- 一个源文件可以包含多个类，但 `public` 类最多一个；编译后每个类各自生成 `.class` 文件。

## JDK、JRE 与 JVM

| 名称 | 定义 | 包含内容 |
| --- | --- | --- |
| JVM | 执行字节码的抽象机器，是一个规范 | 类加载、校验、执行引擎与运行时数据区 |
| JRE | 运行环境，是 JVM 的实现加上运行所需资源 | JVM、类库和其他运行组件 |
| JDK | 开发工具包，是 JRE 加上开发工具 | JRE、`javac` 编译器、`jar`、`javadoc` 和诊断工具 |

关系可以记为：`JDK = JRE + 开发工具`，`JRE = JVM + 类库`。三者在每个操作系统上都有各自的实现，因此是平台相关的；Java 程序的平台无关性来自字节码与 JVM 的分工。

JVM 内部的主要组成部分：

| 组件 | 作用 |
| --- | --- |
| 类加载器 | 加载类文件并建立运行时类型信息 |
| 运行时数据区 | 栈、堆、方法区等存储区域 |
| 执行引擎 | 解释器与 JIT 编译器执行字节码 |
| 本地方法接口 | 调用 JVM 之外的原生代码 |

详细结构与垃圾回收见[进阶：JVM](advanced/jvm/index.md)。

## 关键字速查

以下列表以 **Java 21 语言规范**为准，区分保留关键字和上下文关键字。

### 保留关键字

Java 21 定义了 51 个保留关键字，不能用作普通标识符：

```text
abstract   assert       boolean      break        byte
case       catch        char         class        const
continue   default      do           double       else
enum       extends      final        finally      float
for        goto         if           implements   import
instanceof int          interface    long         native
new        package      private      protected    public
return     short        static       strictfp     super
switch     synchronized this         throw        throws
transient  try          void         volatile     while
_
```

其中 `const` 和 `goto` 被保留但没有对应的语言功能，`strictfp` 在 Java 21 中已过时，单独的 `_` 也属于保留关键字。

### 上下文关键字

以下 17 个名称只在特定语法环境中被解释为关键字，它们在其他位置的可用性还受到具体语法规则约束：

```text
exports    module       non-sealed   open         opens
permits    provides     record       requires     sealed
to         transitive   uses         var          when
with       yield
```

例如，`var` 用于局部变量类型推断，`record` 用于声明记录类，`yield` 用于在 switch 表达式的语句块中产生结果。

!!! note "关键字与字面量"
    `true`、`false` 和 `null` 是字面量。`String`、`System` 是类名，`main` 是方法名，它们都不属于关键字。

## 阅读顺序

| 分类 | 内容 |
| --- | --- |
| 入门 | 语言由来与历史、第一个程序、JDK/JRE/JVM、关键字（本页）；教程结构、特性、数据类型、Unicode 与运算符见 [Java 概述](overview.md) |
| [核心](basics/overview.md) | 基本语法、流程控制、面向对象、字符串与数组、集合、泛型、异常和 IO |
| [进阶](advanced/overview.md) | 函数式编程、反射与注解、网络、并发和 JVM |
| [框架](framework/overview.md) | 框架的职责、依赖注入与应用组织方式 |
| [第三方库](third-party/overview.md) | 引入依赖、使用外部 API 与管理版本 |

## 参考资料

- [Tpoint Tech：History of Java](https://www.tpointtech.com/history-of-java)。
- [Tpoint Tech：Java Hello World Program](https://www.tpointtech.com/java-hello-world-program)。
- [Tpoint Tech：Internal Details of Hello Java Program](https://www.tpointtech.com/internal-details-of-hello-java-program)。
- [Tpoint Tech：Difference between JDK, JRE, and JVM](https://www.tpointtech.com/difference-between-jdk-jre-and-jvm)。
- [Tpoint Tech：JVM (Java Virtual Machine) Architecture](https://www.tpointtech.com/jvm-java-virtual-machine)。
- [Tpoint Tech：Java Keywords](https://www.tpointtech.com/java-keywords)。
- [Java 21 语言规范：Keywords](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.9)。
- [Java 21 JVM 规范：The Structure of the Java Virtual Machine](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)。
