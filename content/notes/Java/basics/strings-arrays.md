# 字符串与数组

字符串用于保存和处理文本，数组用于保存固定数量、同一种元素类型的数据。它们是处理用户输入、文件内容和批量数据时最常见的基础类型。

## 字符串

### 创建与字符串常量池

字符串字面量写在双引号中。相同内容的字面量在字符串常量池中只保留一份，两个变量引用同一个对象：

```java
String s1 = "Welcome";
String s2 = "Welcome";
System.out.println(s1 == s2); // true，同一个池中对象
```

`new String(...)` 显式创建新的字符串对象，即使内容与池中的字符串相同，引用也不相等：

```java
String s1 = new String("Welcome");
String s2 = new String("Welcome");
System.out.println(s1 == s2); // false，两个不同对象
System.out.println(s1.equals(s2)); // true，内容相同
```

`String.intern()` 返回与当前内容对应的池中字符串。常量池是一种运行时的优化实现，比较内容仍应使用 `equals`，不要依赖池行为让 `==` 偶然正确。

### 不可变性与常用操作

`String` 是不可变类。对字符串调用 `strip()`、`replace()` 或拼接操作会产生结果字符串，原有字符串对象的内容不会因此改变。

**语法：**

```java
String title = "Java";
String cleaned = title.strip();
```

| 常用操作 | 方法或写法 |
| --- | --- |
| 获取长度 | `text.length()` |
| 是否为空或空白 | `text.isEmpty()`、`text.isBlank()` |
| 比较内容 | `text.equals(other)`、`text.equalsIgnoreCase(other)` |
| 查找内容 | `text.contains("Java")`、`text.indexOf("a")` |
| 前缀与后缀 | `text.startsWith("Ja")`、`text.endsWith("va")` |
| 截取片段 | `text.substring(begin, end)`，包含起点、不包含终点 |
| 去除两端空白 | `text.strip()` |
| 替换内容 | `text.replace(old, new)` |
| 大小写转换 | `text.toUpperCase()`、`text.toLowerCase()` |
| 分割文本 | `text.split(regex)`，参数是正则表达式 |
| 连接文本 | `String.join(", ", items)` |

### StringBuilder

需要多次追加文本时，可以使用 `StringBuilder`。调用 `append()` 修改构建器的内容，最后通过 `toString()` 得到字符串。与 `String` 不同，`StringBuilder` 可变，适合循环中的拼接：

```java
StringBuilder builder = new StringBuilder();
for (int i = 1; i <= 3; i++) {
    builder.append("Lesson ").append(i).append("\n");
}
String result = builder.toString();
```

| 类 | 线程安全 | 使用场景 |
| --- | --- | --- |
| `String` | 不可变，天然安全 | 保存和传递文本 |
| `StringBuilder` | 否 | 单线程中的频繁拼接 |
| `StringBuffer` | 是，方法同步 | 多线程共享的拼接，通常不如直接使用 `StringBuilder` 配合锁 |

## 数组

数组的长度在创建后固定，使用从 `0` 开始的下标访问元素。

**语法：**

```java
int[] scores = {72, 85, 93};
int[] buffer = new int[5];          // 默认值为 0
String[] names = new String[3];     // 默认值为 null
```

数组长度使用字段 `array.length`，字符串长度使用方法 `text.length()`。未初始化的数组元素获得默认值：数值类型为 `0`，`boolean` 为 `false`，引用类型为 `null`。

多维数组是数组的数组：

```java
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6}
};
System.out.println(matrix.length);    // 2，行数
System.out.println(matrix[0].length); // 3，第一行的列数
```

`Arrays` 工具类提供排序、复制、比较和格式化输出等操作：

```java
int[] sorted = Arrays.copyOf(scores, scores.length);
Arrays.sort(sorted);
System.out.println(Arrays.toString(sorted));
System.out.println(Arrays.equals(scores, sorted));
```

`Arrays.copyOf` 创建新数组，排序只影响副本。数组中存放引用类型元素时，这种复制不会自动复制元素指向的对象。需要可变长度的序列时使用 `ArrayList` 等集合，见[集合框架](collections.md)。

### 字符串与数组互转

```java
char[] letters = "Java".toCharArray();
String word = new String(letters);
String[] parts = "a,b,c".split(",");
String joined = String.join("-", parts); // a-b-c
```

## 示例：整理课程名称与成绩

```java title="Main.java"
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        String raw = "  Java Core  ";
        String title = raw.strip();
        String sameTitle = new String("Java Core");

        int[] scores = {82, 65, 91};
        int[] sorted = Arrays.copyOf(scores, scores.length);
        Arrays.sort(sorted);

        System.out.println(title);
        System.out.println("Same text: " + title.equals(sameTitle));
        System.out.println("Original: " + Arrays.toString(scores));
        System.out.println("Sorted: " + Arrays.toString(sorted));
    }
}
```

**输出：**

```text
Java Core
Same text: true
Original: [82, 65, 91]
Sorted: [65, 82, 91]
```

`strip()` 返回去除两端空白的新字符串，原字符串不变。`equals` 比较内容，所以 `new String("Java Core")` 与 `title` 相等；如果这里使用 `==`，结果为 `false`。`Arrays.copyOf` 创建新数组，排序只影响副本。

## 示例：整理课程名单

```java title="Main.java"
public class Main {
    public static void main(String[] args) {
        String input = " Java Core , Data Structures , 算法";
        String[] names = input.split(",");

        StringBuilder lines = new StringBuilder();
        for (String name : names) {
            String cleaned = name.strip();
            if (!cleaned.isEmpty()) {
                lines.append(cleaned).append(System.lineSeparator());
            }
        }

        System.out.println(lines);
        System.out.println("Total: " + names.length);
    }
}
```

**输出：**

```text
Java Core
Data Structures
算法

Total: 3
```

`split(",")` 把原始文本按逗号分成三段，每段仍带有空白。循环中对每段执行 `strip()`，空段跳过，非空段追加到 `StringBuilder`，最后整体输出。`System.lineSeparator()` 是当前平台的换行符。

## 字符、代码单元与长度

`char` 表示一个 UTF-16 代码单元。某些字符需要两个代码单元，因此 `String.length()` 不一定等于用户看到的字符数量：

```java
String emoji = "😀";
System.out.println(emoji.length()); // 2，两个 char
System.out.println(emoji.codePointCount(0, emoji.length())); // 1，一个码点
```

需要按 Unicode 码点处理文本时，可以使用 `codePoints()` 或 `codePointCount()`；按视觉字符分组还可能涉及组合字符等规则。

## 注意事项

- 比较字符串内容使用 `equals`，不要依赖字符串常量池使 `==` 偶然得到正确结果。
- `Arrays.sort(array)` 会直接改变传入的数组；需要保留原顺序时先复制。
- 数组赋值 `copy = original` 只是复制引用，两个变量指向同一数组。
- `split(".")` 中的点是正则语法，按普通点号分割通常需要写成 `split("\\.")`。
- 循环中大量拼接字符串应使用 `StringBuilder`，避免产生大量中间字符串对象。
- `substring` 的结束位置不包含终点，超出边界会抛出 `StringIndexOutOfBoundsException`。

## 练习

1. 用 `String.format` 把课程名称整理成“1. Java Core / 2. Data Structures”形式的带编号列表。
2. 统计一段文本的单词个数：按空白字符 `split("\\s+")` 分割，再排除空字符串。

## 参考资料

- [Tpoint Tech：Java Strings](https://www.tpointtech.com/java-string)。
- [Java 21 API：String](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)。
- [Java 21 API：Arrays](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html)。
