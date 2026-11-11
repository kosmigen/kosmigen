---
title: Java 概述
description: Java 的教程结构、主要特性、与 C++ 的对比，以及数据类型、Unicode 编码和运算符，以 JDK 21 为示例基准。
---

# Java 概述

本页汇总 Java 的语言定位与入门概念：教程如何组织、语言有哪些主要特性、与 C++ 的区别、数据类型、字符编码和运算符。语言的由来、第一个程序以及 JDK、JRE、JVM 的关系见 [Java](intro.md)。

## Java 教程概览

Java 教程通常按以下顺序展开，对应本栏目的分类：

| 教程阶段 | 主要内容 | 对应栏目 |
| --- | --- | --- |
| 入门 | 历史、特性、环境与第一个程序 | [Java](intro.md)、本页 |
| 语言基础 | 数据类型、变量、运算符、流程控制 | [核心：基本语法](basics/syntax.md)等 |
| 面向对象 | 类、继承、多态、抽象与封装 | [核心：面向对象](basics/oop.md) |
| 标准库 | 字符串、集合、异常、IO | [核心知识](basics/overview.md) |
| 进阶机制 | 反射、并发、网络、JVM | [进阶](advanced/overview.md) |
| 应用开发 | 框架与第三方库 | [框架](framework/overview.md)、[第三方库](third-party/overview.md) |

## Java 的主要特性

| 特性 | 含义 | 实际情况 |
| --- | --- | --- |
| 简单 | 语法接近 C++，去掉了指针、运算符重载等 | 上手容易，但仍需理解静态类型和类结构 |
| 面向对象 | 以类和对象组织数据与行为 | 基本类型等少数值不是对象 |
| 可移植、平台无关 | 编译为字节码，由各平台的 JVM 执行 | JVM 本身按平台实现；原生依赖、路径等仍需注意 |
| 安全 | 不暴露指针，运行时校验字节码，类加载器隔离来源 | `SecurityManager` 在现代版本中已弃用，安全边界依赖模块与平台机制 |
| 健壮 | 垃圾回收、异常处理、编译期类型检查 | 逻辑错误仍需测试；GC 不负责所有资源 |
| 架构中立 | 基本类型的大小固定，不随平台变化 | 具体内存布局仍由实现决定 |
| 解释执行 | 字节码由 JVM 解释 | HotSpot 等实现通过 JIT 把热点编译为机器码 |
| 高性能 | 字节码接近机器码，JIT 持续优化 | 通常慢于 C、C++ 等直接编译的语言 |
| 多线程 | 语言与标准库内置线程支持 | 共享状态仍需同步设计，见[并发编程](advanced/concurrency/index.md) |
| 分布式 | 网络 API 与远程调用能力 | RMI 使用有限，现代应用多使用 HTTP 和 RPC |
| 动态 | 类按需加载，支持反射 | 模块系统会限制部分动态能力 |

这些特性描述的是设计倾向，不是绝对承诺。实际开发中应结合具体场景判断。

## C++ 与 Java 的对比

| 比较项 | C++ | Java |
| --- | --- | --- |
| 运行方式 | 编译为平台相关机器码 | 编译为字节码，由 JVM 执行 |
| 内存管理 | 手动 `new`/`delete` | 垃圾回收自动回收 |
| 指针 | 支持，可直接操作内存 | 语言层面不暴露指针 |
| 多重继承 | 类支持多重继承 | 类不支持，接口可以多实现 |
| 运算符重载 | 支持 | 不支持 |
| 泛型机制 | 模板 | 泛型与类型擦除 |
| 默认参数 | 支持 | 不支持，通常用重载代替 |
| 头文件 | 使用 `#include` | 使用 `import` 引入类型 |
| 异常处理 | 支持，可选 | 受检异常必须处理或声明 |
| 线程支持 | 传统上依赖第三方库 | 语言与标准库内置 |
| 继承体系 | 可以存在多个根 | 所有类都直接或间接继承 `Object` |
| `goto` | 支持 | 保留关键字，没有对应功能 |

两者都能用于面向对象编程，但设计目标不同：C++ 更接近系统与硬件，Java 更强调跨平台运行和自动内存管理。

## 数据类型

Java 是静态类型语言，变量需要先声明类型。类型分为基本类型和引用类型。

| 类型 | 大小 | 范围或说明 | 默认值 |
| --- | --- | --- | --- |
| `boolean` | 由实现决定 | `true` 或 `false` | `false` |
| `char` | 16 位 | `'\u0000'` 到 `'￿'`，无符号 | `'\u0000'` |
| `byte` | 8 位 | -128 到 127 | `0` |
| `short` | 16 位 | -32,768 到 32,767 | `0` |
| `int` | 32 位 | 约 ±21 亿 | `0` |
| `long` | 64 位 | 约 ±9.2 × 10^18，后缀 `L` | `0L` |
| `float` | 32 位 | IEEE 754 单精度，约 6—7 位有效数字，后缀 `F` | `0.0F` |
| `double` | 64 位 | IEEE 754 双精度，约 15 位有效数字 | `0.0D` |

`float` 不适合需要精确小数位数的场景（如金额），应使用 `BigDecimal` 或整数单位。Java 8 起可以通过 `Integer`、`Long` 的 API 按无符号数解释对应的 32 位、64 位值。

类、接口、数组和 `String` 属于引用类型，默认值为 `null`。基本类型的大小固定，这也是“架构中立”特性的体现。详细用法见[核心：基本语法](basics/syntax.md)。

## Unicode 与字符编码

计算机内部用二进制表示字符，这一映射关系称为编码。早期编码互不兼容：ASCII 用于美国，ISO 8859-1 用于西欧语言，GB18030、BIG-5 用于中文，不同编码的同一字节序列可能表示不同字符。

Unicode 为世界上大多数书写系统统一分配码点。常见转换格式：

| 格式 | 编码单元 | 说明 |
| --- | --- | --- |
| UTF-8 | 8 位 | 变长编码，兼容 ASCII，网络传输常用 |
| UTF-16 | 16 位 | Java 的 `char` 与 `String` 内部使用的编码单元 |
| UTF-32 | 32 位 | 定长，每个码点占 4 字节 |

Java 源码中可以用转义序列书写 Unicode 字符，`\u` 后跟 4 位十六进制：

```java title="UnicodeDemo.java"
public class UnicodeDemo {
    public static void main(String[] args) {
        char a = 'A';
        char b = 'B';
        System.out.println(a + "" + b);
    }
}
```

**输出：**

```text
AB
```

`char` 是 16 位，最多表示 65,536 个码点，不足以覆盖全部 Unicode 字符。超出 16 位的字符称为增补字符，在 Java 中用一对 `char`（代理对）表示，因此 `"😀".length()` 为 `2` 而不是 `1`。按码点处理文本的方法见[核心：字符串与数组](basics/strings-arrays.md)。

## 运算符

| 类别 | 运算符 | 说明 |
| --- | --- | --- |
| 一元 | `+`、`-`、`!`、`~`、`++`、`--` | 单个操作数，`++`、`--` 有前缀与后缀之分 |
| 算术 | `+`、`-`、`*`、`/`、`%` | 整数除法向零截断 |
| 移位 | `<<`、`>>`、`>>>` | 操作二进制位，`>>>` 高位补 0 |
| 关系 | `==`、`!=`、`>`、`>=`、`<`、`<=` | 结果为 `boolean` |
| 位运算 | `&`、`\|`、`^`、`~` | 按位与、或、异或、取反 |
| 逻辑 | `&&`、`\|\|`、`!` | `&&`、`\|\|` 短路求值 |
| 条件 | `条件 ? 值一 : 值二` | 三元运算符 |
| 赋值 | `=`、`+=`、`-=` 等 | 复合赋值隐含窄化转换 |

运算符的优先级、类型提升与完整示例见[核心：基本语法](basics/syntax.md)。

## 参考资料

- [Tpoint Tech：Java Tutorial](https://www.tpointtech.com/java-tutorial)，参考专题组织与示例讲解形式。
- [Tpoint Tech：Features of Java](https://www.tpointtech.com/features-of-java)。
- [Tpoint Tech：Difference Between C++ and Java](https://www.tpointtech.com/cpp-vs-java)。
- [Tpoint Tech：Data Types in Java](https://www.tpointtech.com/java-data-types)。
- [Tpoint Tech：Unicode System in Java](https://www.tpointtech.com/unicode-system-in-java)。
- [Tpoint Tech：Java Operators](https://www.tpointtech.com/java-operators)。
- [Java 21 语言规范：Keywords](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.9)。
