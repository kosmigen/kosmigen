# 泛型

泛型允许类、接口和方法接收类型参数。它使同一套代码能够处理不同类型的数据，同时让编译器检查使用方式是否符合类型约束。

## 为什么使用泛型

如果集合只按原始类型声明，取出元素时可能需要强制转换，而且类型错误容易推迟到运行时：

```java
List raw = new ArrayList();
raw.add("Java");
raw.add(35);                 // 编译通过
String topic = (String) raw.get(0); // 强制转换，内容符合才不报错
```

声明为 `List<String>` 后，编译器会检查添加和读取元素的类型：

```java
List<String> topics = new ArrayList<>();
topics.add("Java");
// topics.add(35); // 不编译
String topic = topics.get(0); // 不需要转换
```

## 泛型类与泛型方法

**语法：**

```java
class Box<T> {
    private T value;
}
```

`T` 是类型参数；创建 `Box<String>` 时，`String` 是类型实参。`T`、`E`、`K`、`V` 是常见命名约定，并非特殊关键字。一个类可以声明多个类型参数，例如 `Map<K, V>` 使用两个。

泛型方法的类型参数声明在返回类型之前：

```java
static <T> T first(T[] values) {
    return values[0];
}
```

调用泛型方法时，编译器通常可以根据参数推断类型，也可以显式写出类型实参。接口同样可以携带类型参数，例如 `Comparable<T>`；实现接口时一般会给出具体类型，见[集合框架](collections.md)中的排序示例。

类型参数可以带有边界，`<T extends Number>` 表示实参必须是 `Number` 或其子类型。多个边界使用 `&` 连接，例如 `<T extends Comparable<T> & Serializable>`，类边界只能有一个且放在最前。

## 示例：保存不同类型的值

```java title="Main.java"
class Box<T> {
    private final T value;

    Box(T value) {
        this.value = value;
    }

    T get() {
        return value;
    }
}

public class Main {
    static <T> T first(T[] values) {
        if (values.length == 0) {
            throw new IllegalArgumentException("values must not be empty");
        }
        return values[0];
    }

    public static void main(String[] args) {
        Box<String> topic = new Box<>("Generics");
        Box<Integer> minutes = new Box<>(35);
        System.out.println(topic.get());
        System.out.println(minutes.get());
        System.out.println(first(new String[]{"Java", "Python"}));
    }
}
```

**输出：**

```text
Generics
35
Java
```

`Box` 的类型参数属于类，`first` 的类型参数则声明在方法的返回类型之前。`new Box<>(35)` 中的空菱形让编译器推断类型实参，避免重复书写。

## 类型边界与通配符

| 写法 | 含义 |
| --- | --- |
| `<T extends Number>` | 类型参数必须是 `Number` 或其子类型 |
| `List<?>` | 元素类型未知的列表 |
| `List<? extends Number>` | 接收某一种 `Number` 子类型的列表，适合按 `Number` 读取 |
| `List<? super Integer>` | 接收 `Integer` 或其父类型的列表，可以添加 `Integer` |

`List<Integer>` 不能直接赋值给 `List<Number>`。如果允许这种赋值，调用方就可能向原本只接受整数的列表中放入其他数字类型。

下面的方法接收整数或浮点数列表并计算总和：

```java
static double sum(List<? extends Number> values) {
    double total = 0;
    for (Number value : values) {
        total += value.doubleValue();
    }
    return total;
}
```

使用 `extends` 时，具体元素类型未知，通常不能向该列表添加非 `null` 值。使用 `super` 时可以写入相应类型，但取出的值只能安全地按 `Object` 处理。简记为 PECS：只读取用 `extends`，只写入用 `super`。

## 示例：汇总与写入成绩

```java title="Main.java"
import java.util.ArrayList;
import java.util.List;

public class Main {
    static void addScore(List<? super Integer> scores) {
        scores.add(88);
    }

    static double average(List<? extends Number> scores) {
        double total = 0;
        for (Number score : scores) {
            total += score.doubleValue();
        }
        return total / scores.size();
    }

    public static void main(String[] args) {
        List<Number> records = new ArrayList<>();
        addScore(records);
        addScore(records);
        System.out.println("Average: " + average(records));
    }
}
```

**输出：**

```text
Average: 88.0
```

`records` 是 `List<Number>`，同时满足 `? super Integer` 和 `? extends Number`。`addScore` 只需要向列表写入 `Integer`，用下界通配符；`average` 只需要按 `Number` 读取元素，用上界通配符。方法各取所需，调用方不需要改变列表的类型声明。

## 类型擦除

Java 主要通过编译期检查实现泛型，生成的字节码会使用类型擦除，并在需要的位置插入转换。因此，不能使用 `new T()`、`T.class`，也不能通过 `instanceof List<String>` 检查元素类型。

类型擦除不表示所有泛型信息都消失。类、字段和方法声明上的部分泛型签名可以通过反射查询。

## 注意事项

- 类型实参使用引用类型，例如 `Integer`，不能写成 `Box<int>`。
- 避免使用原始类型 `List` 或 `Box` 绕过类型检查。
- 泛型类型之间的继承关系不能只根据类型实参的继承关系推断。
- 静态成员不能使用类声明的类型参数；需要泛型静态方法时，在方法上单独声明 `<T>`。
- 重载不能只靠类型参数区分，因为擦除后签名可能相同。
- `List<?>` 仍可以执行 `size()`、读取元素或清空列表等操作，具体修改能力还取决于实现。

## 练习

1. 为 `Box<T>` 增加一个泛型静态方法，交换任意引用类型数组中的两个元素。说明为什么这个方法不能直接接收 `int[]`。
2. 定义一个 `Pair<K, V>` 类保存两个值，并提供 `Pair<K, V> of(K key, V value)` 静态工厂方法，用它保存“课程名称-分数”。

## 参考资料

- [Tpoint Tech：Java Generics](https://www.tpointtech.com/java-generics)。
- [Dev.java：Generics](https://dev.java/learn/generics/)。
