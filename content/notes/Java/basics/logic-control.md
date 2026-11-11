# 流程控制

流程控制决定代码以什么顺序执行。Java 提供条件分支、循环和跳转语句，可以根据输入选择操作，也可以重复处理一组数据。

## 条件分支

### if 语句

`if` 根据布尔条件决定是否执行语句块：

```java
if (条件) {
    // 条件成立时执行
}
```

`else` 处理条件不成立时的情况：

```java
if (条件) {
    // 条件成立时执行
} else {
    // 条件不成立时执行
}
```

多个条件可以用 `else if` 连接成链。条件按顺序判断，进入一个分支后不会继续尝试后面的分支：

```java
if (条件一) {
    // 条件一成立时执行
} else if (条件二) {
    // 条件一不成立、条件二成立时执行
} else {
    // 所有条件都不成立时执行
}
```

`if` 可以嵌套使用，用于表达同时满足多个条件或逐层细分的情况：

```java
String address = "Delhi, India";
if (address.endsWith("India")) {
    if (address.contains("Meerut")) {
        System.out.println("Your city is Meerut");
    } else {
        System.out.println(address.split(",")[0]);
    }
}
```

嵌套层数增加时会降低可读性，可以先提取方法或合并条件再考虑嵌套。

### switch

`switch` 按一个值的不同情况选择操作。传统写法使用 `case ...:` 和 `break`：

```java
switch (level) {
    case 1:
        System.out.println("Beginner");
        break;
    case 2:
        System.out.println("Intermediate");
        break;
    default:
        System.out.println("Advanced");
}
```

漏写 `break` 会贯穿执行到下一个分支。`case` 后面的值必须是常量且不能重复，`default` 在没有任何分支匹配时执行，位置不固定但通常放在最后。

Java 14 起 `switch` 也可以作为表达式产生值。箭头形式的每个分支执行后自动结束，不会贯穿：

```java
String label = switch (level) {
    case 1 -> "Basic";
    case 2 -> "Intermediate";
    default -> "Advanced";
};
```

传统冒号形式在表达式中使用 `yield` 产生结果：

```java
String label = switch (level) {
    case 1: yield "Basic";
    case 2: yield "Intermediate";
    default: yield "Advanced";
};
```

一个分支可以列出多个值：

```java
int days = switch (month) {
    case "April", "June", "September", "November" -> 30;
    case "January", "March", "May", "July", "August", "October", "December" -> 31;
    default -> 0;
};
```

`switch` 的表达式类型支持整数、字符、枚举和字符串。作为表达式时通常要求分支覆盖所有可能情况，`default` 分支可以满足这一要求。

## 循环

| 写法 | 适合的情况 |
| --- | --- |
| `for` | 需要计数器或明确的初始化、条件和更新步骤 |
| 增强 `for` | 依次访问数组或可迭代对象的元素 |
| `while` | 根据条件决定是否继续，循环次数不确定 |
| `do ... while` | 先执行一次循环体，再判断条件 |

**语法：**

```java
for (初始化; 继续条件; 更新操作) {
    // 循环体
}

for (元素类型 变量 : 数组或 Iterable) {
    // 循环体
}

while (继续条件) {
    // 循环体
}

do {
    // 循环体，至少执行一次
} while (继续条件);
```

`for (int i = 0; ...)` 中声明的循环变量只在这个循环内有效。增强 `for` 的变量在每次迭代时绑定当前元素，修改变量本身不影响数组或集合。

## 跳转语句

`break` 结束当前循环或相应的 switch 语句，`continue` 跳过当前循环中剩余的操作，`return` 则结束当前方法。它们的默认作用范围是最近的语句，嵌套循环中可以使用标签指定目标：

```java
outer:
for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 3; j++) {
        if (i * j == 6) {
            break outer; // 结束外层循环
        }
        System.out.println(i + " x " + j + " = " + (i * j));
    }
}
```

**输出：**

```text
1 x 1 = 1
1 x 2 = 2
1 x 3 = 3
2 x 1 = 2
2 x 2 = 4
```

`i * j` 等于 6 时 `break outer` 直接结束外层循环，因此后面的乘积不再输出。`continue 标签` 类似，只是结束外层循环的当前一次迭代。标签跳转不易阅读，仅在确实需要时使用。

## 示例：统计有效学习时长

```java title="Main.java"
public class Main {
    public static void main(String[] args) {
        int[] minutes = {25, 0, 40, -1, 30};
        int total = 0;
        int validDays = 0;

        for (int value : minutes) {
            if (value <= 0) {
                continue;
            }
            total += value;
            validDays++;
        }

        String result = total >= 90 ? "Target reached" : "Keep going";
        System.out.println("Total: " + total);
        System.out.println("Valid days: " + validDays);
        System.out.println(result);
    }
}
```

**输出：**

```text
Total: 95
Valid days: 3
Target reached
```

本例把非正数视为无效记录。`continue` 使这些值不参与累计；有效值同时更新总时长和天数。最后用条件运算符根据累计时长选择提示语。

## 示例：每月天数

```java title="Main.java"
public class Main {
    static int daysInMonth(String month) {
        return switch (month) {
            case "February" -> 28;
            case "April", "June", "September", "November" -> 30;
            case "January", "March", "May", "July", "August", "October", "December" -> 31;
            default -> 0;
        };
    }

    public static void main(String[] args) {
        String[] months = {"January", "February", "April", "June", "March", "Unknown"};
        for (String month : months) {
            System.out.println(month + " has " + daysInMonth(month) + " days");
        }
    }
}
```

**输出：**

```text
January has 31 days
February has 28 days
April has 30 days
June has 30 days
March has 31 days
Unknown has 0 days
```

`switch` 表达式按月份名产生天数，多个 30 天的月份合并为一个分支。`default` 处理无法识别的名称，返回 0 表示无效输入；这里没有考虑闰年，练习中会补上。

## 注意事项

- 数组下标通常使用 `i < array.length`，写成 `<=` 会多访问一个位置。
- `while` 的循环体应使状态逐步接近退出条件，或提供明确的 `break`。
- Java 条件需要布尔表达式，不能直接把整数当作真假值。
- 传统 `switch` 漏写 `break` 会贯穿到下一个分支；需要多个值走同一分支时，表达式形式的多标签写法更清晰。
- `do ... while` 的条件在循环体之后判断，即使条件一开始就不成立也会执行一次。
- 对可修改集合进行结构性增删时，不应直接依赖普通增强 `for`；参见[集合框架](collections.md)。

## 练习

1. 修改“统计有效学习时长”示例：累计时长达到 60 分钟后立刻结束循环。说明此时总时长为什么可能大于 60，而不是恰好等于 60。
2. 为“每月天数”示例增加闰年判断：给 `daysInMonth` 增加年份参数，February 根据年份返回 28 或 29。

## 参考资料

- [Tpoint Tech：Control Statements in Java](https://www.tpointtech.com/control-statements-in-java)。
- [Java 21 语言规范：Blocks, Statements, and Patterns](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html)。
