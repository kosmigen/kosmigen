# 基本语法

Java 程序由类、字段、方法和语句组成。基本语法决定如何声明数据、描述计算，并把重复的操作组织为方法。本文覆盖注释、字面量、变量、运算符、类型转换、方法和包的写法。

## 注释

```java
// 单行注释
/* 多行注释，可以跨行 */
/** 文档注释，由 javadoc 工具生成 API 文档 */
```

注释不参与编译。文档注释只能写在声明之前，用于描述类、方法和字段的契约。

## 字面量

字面量直接写在源码里，表示固定的值：

```java
int decimal = 2026;            // 十进制
int hex = 0x7EA;               // 十六进制，等于 2026
int binary = 0b111_1110_1010;  // 二进制，等于 2026，下划线只起分隔作用
long budget = 1_000_000_000L;  // L 表示 long
double ratio = 0.5;            // 默认小数是 double
float rate = 0.5F;             // F 表示 float
char letter = 'A';
boolean done = false;
String name = "Java";
```

`\n`、`\t`、`\'`、`\\` 等转义序列在字符和字符串字面量中表示特殊字符。多行文本可以使用文本块，每行末尾的换行和公共缩进会被自动处理：

```java
String query = """
    SELECT id, name
    FROM users
    WHERE active = true
    """;
```

## 变量与数据类型

变量有确定的类型，用于保存程序运行时需要使用的值。

**语法：**

```java
类型 变量名 = 初始值;
```

Java 有 8 种基本数据类型：

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| `byte` | 8 位有符号整数 | `byte level = 3;` |
| `short` | 16 位有符号整数 | `short year = 2026;` |
| `int` | 32 位有符号整数 | `int count = 10;` |
| `long` | 64 位有符号整数 | `long total = 100L;` |
| `float` | 32 位浮点数 | `float ratio = 0.5F;` |
| `double` | 64 位浮点数 | `double price = 9.5;` |
| `char` | 一个 UTF-16 代码单元 | `char grade = 'A';` |
| `boolean` | 布尔值 | `boolean finished = false;` |

类、接口和数组等属于引用类型。引用类型的变量可以保存对象引用，也可以保存 `null`。

局部变量需要在读取前明确赋值；对象字段和数组元素则会获得对应类型的默认值。`final` 变量只能被赋值一次，但 `final` 引用指向的对象仍可能发生变化。

`var` 可以推断已初始化局部变量的类型，变量仍具有静态类型：

```java
var count = 10;      // 推断为 int
var label = "done";  // 推断为 String
```

## 运算符

| 类别 | 常用运算符 |
| --- | --- |
| 一元 | `++`、`--`、`!`、`~` |
| 算术 | `+`、`-`、`*`、`/`、`%` |
| 移位 | `<<`、`>>`、`>>>` |
| 位运算 | `&`、`\|`、`^`、`~` |
| 关系 | `==`、`!=`、`>`、`>=`、`<`、`<=`、`instanceof` |
| 逻辑 | `&&`、`\|\|`、`!` |
| 条件 | `条件 ? 值一 : 值二` |
| 赋值 | `=`、`+=`、`-=`、`*=` 等 |

### 一元运算符

`++` 和 `--` 的前缀与后缀形式区别在取值时机：

```java
int step = 5;
int before = step++;  // 先取值再自增：before 为 5，step 变为 6
int after = ++step;   // 先自增再取值：step 变为 7，after 为 7
System.out.println(before + " -> " + after); // 5 -> 7
```

`!` 取逻辑反，`~` 按位取反。

### 算术运算符

整数相除产生整数结果，`7 / 2` 为 `3`，`7 / 2.0` 为 `3.5`。取余结果的符号跟随被除数，`-7 % 3` 为 `-1`。

`byte`、`short`、`char` 参与算术运算时先提升为 `int`：

```java
byte quiz = 40;
byte exam = 90;
int total = quiz + exam; // 130，两个 byte 的和按 int 计算
```

### 移位与位运算符

移位直接操作二进制位，`x << 2` 相当于乘以 4，`x >> 2` 相当于除以 4 并向负无穷取整：

| 运算符 | 作用 | 示例 |
| --- | --- | --- |
| `<<` | 左移，低位补 0 | `12 << 2` 为 `48` |
| `>>` | 右移，高位补符号位 | `12 >> 2` 为 `3` |
| `>>>` | 无符号右移，高位补 0 | `-12 >>> 2` 为 `1073741821` |
| `&` | 按位与 | `12 & 10` 为 `8` |
| `\|` | 按位或 | `12 \| 10` 为 `14` |
| `^` | 按位异或 | `12 ^ 10` 为 `6` |
| `~` | 按位取反 | `~12` 为 `-13` |

### 关系、逻辑与条件运算符

关系运算符比较大小和相等。`&&` 和 `\|\|` 具有短路求值行为：左侧结果已经决定整个表达式时，右侧不再计算。

条件运算符按条件选择两个值之一。`instanceof` 判断引用类型，Java 16 起支持在判断中直接声明模式变量：

```java
Object value = "hello";
if (value instanceof String text && !text.isBlank()) {
    System.out.println(text.length()); // 5
}
```

### 赋值与复合赋值

复合赋值会隐含一次窄化转换：

```java
int i = 5;
i += 1.5;      // 等价于 i = (int)(i + 1.5)，i 变为 6
// i = i + 1.5; // 直接赋值不编译：int 变量不能接收 double 结果
```

### 优先级

相邻运算的先后由优先级决定；不确定时使用括号。主要级别由高到低：

| 优先级 | 运算符 |
| --- | --- |
| 后缀 | `++`、`--` |
| 一元 | `+`、`-`、`!`、`~`、`++`、`--`、`(类型)` |
| 乘除 | `*`、`/`、`%` |
| 加减 | `+`、`-` |
| 移位 | `<<`、`>>`、`>>>` |
| 关系 | `<`、`>`、`<=`、`>=`、`instanceof` |
| 相等 | `==`、`!=` |
| 位与 | `&` |
| 位异或 | `^` |
| 位或 | `\|` |
| 逻辑与 | `&&` |
| 逻辑或 | `\|\|` |
| 条件 | `? :` |
| 赋值 | `=`、`+=` 等 |

同一级别按从左到右求值，条件与赋值运算符从右到左。

## 类型转换

宽化转换从小范围到大范围，自动进行：`byte → short → int → long → float → double`，`char → int`。

窄化转换需要显式写出，可能丢失信息：

```java
double value = 8.9;
int whole = (int) value; // 得到 8，向零截断而不是四舍五入
```

整数运算可能溢出：

```java
int max = Integer.MAX_VALUE; // 2147483647
System.out.println(max + 1); // -2147483648
```

需要检测溢出时可以使用 `Math.addExact` 等方法，它们在溢出时抛出 `ArithmeticException`。

## 方法

方法把一段操作封装为可调用的单元。参数描述输入，返回类型描述结果；`void` 表示不返回值。

**语法：**

```java
访问修饰符 返回类型 方法名(参数列表) {
    // 方法体
}
```

`static` 方法属于类，可以通过类名调用。实例方法通过对象调用，能够访问这个对象的实例状态。方法重载和重写的写法见[面向对象](oop.md)。

参数按值传递：方法拿到的是值的副本。基本类型参数在方法内的修改不影响调用方；引用类型参数可以修改同一个对象的状态。

## 示例：计算学习进度

```java title="Main.java"
public class Main {
    static double percentage(int completed, int total) {
        return completed * 100.0 / total;
    }

    public static void main(String[] args) {
        int completed = 3;
        int total = 8;
        double progress = percentage(completed, total);

        System.out.println("Completed: " + completed);
        System.out.println("Progress: " + progress + "%");
        System.out.println("All done: " + (completed == total));
    }
}
```

**输出：**

```text
Completed: 3
Progress: 37.5%
All done: false
```

`100.0` 使计算采用浮点运算。字符串与其他值使用 `+` 连接时，结果为字符串。本例假定 `total` 大于零，输入校验将在[异常处理](exception.md)中介绍。

## 示例：成绩换算

```java title="Main.java"
public class Main {
    public static void main(String[] args) {
        byte quiz = 40;
        byte exam = 90;
        int total = quiz + exam;            // byte 先提升为 int
        double average = total / 2.0;       // 2.0 使除法按浮点计算
        int bonus = average >= 65 ? 5 : 0;  // 条件运算符
        int score = (int) (average + bonus);// 窄化转换

        System.out.println("Total: " + total);
        System.out.println("Average: " + average);
        System.out.println("Score: " + score);
    }
}
```

**输出：**

```text
Total: 130
Average: 65.0
Score: 70
```

两个 `byte` 相加先提升为 `int`，结果可以直接保存到 `int` 变量。`total / 2.0` 中操作数类型不同，`int` 自动提升为 `double`，得到浮点结果。`average >= 65` 为真时 `bonus` 取 5，否则取 0；`(int)` 把 `double` 显式转换回 `int`。

## 包与导入

`package` 声明类所属的包，`import` 允许在代码中使用类型的简单名称：

```java
package learning;

import java.util.List;
```

`java.lang` 中的常用类型会被自动导入，例如 `String` 和 `System`。子包不会因为导入父包而自动导入。

## 注意事项

- 标识符区分大小写，`total` 和 `Total` 是不同名称；标识符不能使用保留关键字。
- `var` 只能用于已初始化的局部变量，不能用于字段、参数或未初始化的声明。
- 字符相加得到的是整数：`'A' + 'B'` 为 `131`；先与字符串连接才会拼接字符。
- 引用类型的 `==` 比较引用身份，内容比较应使用对应类型的 `equals`，见[字符串与数组](strings-arrays.md)。
- 复合赋值隐含窄化转换，`i += 1.5` 合法，`i = i + 1.5` 不编译。
- 文本块 `"""` 内的公共缩进会被移除，结尾的换行行为与普通字符串不同。
- 条件运算符的分支只计算选中的一侧，另一个分支的副作用不会发生。

## 练习

1. 为进度示例增加一个方法，接收“每天学习分钟数”和“天数”，返回总学习时长。分别用 `int` 和 `long` 保存结果，观察类型选择的影响。
2. 用移位运算符把十进制整数转换成二进制字符串：循环判断最低位并右移，最后与 `Integer.toBinaryString` 的结果比较。

## 参考资料

- [Tpoint Tech：Java Variables](https://www.tpointtech.com/java-variables)。
- [Tpoint Tech：Java Operators](https://www.tpointtech.com/operators-in-java)。
- [Java 21 语言规范：Lexical Structure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html)。
- [Java 21 语言规范：Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)。
- [Java 21 语言规范：Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html)。
