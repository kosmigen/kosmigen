# 函数式编程

Java 支持通过函数式接口传递行为。Lambda 和方法引用简化了这种写法，Stream 则把筛选、转换和汇总等操作组合成数据处理流水线。

## 函数式接口

函数式接口具有一个符合规则的抽象方法。`@FunctionalInterface` 可以让编译器检查这个约定；接口仍可以包含默认方法和静态方法。

| 接口 | 典型用途 | 核心方法 |
| --- | --- | --- |
| `Predicate<T>` | 判断元素是否符合条件 | `test` |
| `Function<T, R>` | 把输入转换为结果 | `apply` |
| `Consumer<T>` | 消费一个值 | `accept` |
| `Supplier<T>` | 提供一个值 | `get` |

二元版本 `BiFunction<T, U, R>`、`BiConsumer<T, U>` 接收两个参数；`UnaryOperator<T>`、`BinaryOperator<T>` 是输入输出同类型的 `Function` 和 `BiFunction` 特化。

## Lambda 与方法引用

**语法：**

```java
() -> 表达式                     // 无参数
name -> 表达式                   // 单参数可以省略括号
(name, score) -> 表达式          // 多参数
(name, score) -> { 语句块; }     // 语句块形式，需要返回值时使用 return
```

Lambda 的目标类型由上下文推断，通常是把 Lambda 赋值给函数式接口变量，或作为参数传给接收函数式接口的方法。

方法引用是 Lambda 的简写形式：

| 形式 | 示例 | 等价的 Lambda |
| --- | --- | --- |
| 静态方法 | `String::valueOf` | `x -> String.valueOf(x)` |
| 特定对象的方法 | `System.out::println` | `x -> System.out.println(x)` |
| 任意对象的方法 | `String::length` | `s -> s.length()` |
| 构造器 | `ArrayList::new` | `() -> new ArrayList<>()` |

Lambda 捕获的局部变量必须是 `final` 或实际不再重新赋值的变量。这不意味着被引用对象的内容也不可修改。

## Stream 流水线

Stream 本身不保存一份新的数据集合，它描述对数据源执行的操作。

| 阶段 | 示例 | 说明 |
| --- | --- | --- |
| 创建流 | `list.stream()` | 从数据源建立流水线 |
| 中间操作 | `filter`、`map`、`sorted` | 继续返回流，通常惰性执行 |
| 终止操作 | `toList`、`count`、`reduce` | 触发处理并产生结果或副作用 |

常用中间操作：

| 操作 | 作用 |
| --- | --- |
| `filter` | 保留符合条件的元素 |
| `map` | 把元素转换为另一种值 |
| `flatMap` | 把每个元素展开为流后合并 |
| `distinct` | 去重 |
| `sorted` | 按自然顺序或给定 `Comparator` 排序 |
| `limit`、`skip` | 截取前若干个或跳过前若干个 |

常用终止操作：

| 操作 | 作用 |
| --- | --- |
| `forEach` | 对每个元素执行副作用 |
| `count` | 统计元素数量 |
| `toList` | 收集为不可修改的列表 |
| `collect` | 按收集器规则收集，如 `Collectors.groupingBy` |
| `reduce` | 按函数把元素合并为一个结果 |
| `anyMatch`、`allMatch`、`noneMatch` | 检查是否有元素符合条件 |
| `findFirst`、`findAny` | 取出一个元素，结果为 `Optional` |

## 示例：筛选并整理课程名称

```java title="Main.java"
import java.util.List;
import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        List<String> topics = List.of(" Java ", "IO", "", "Collections");
        Predicate<String> longEnough = name -> name.length() >= 4;

        List<String> result = topics.stream()
                .map(String::strip)
                .filter(longEnough)
                .sorted()
                .toList();

        System.out.println(result);
        System.out.println("Count: " + result.size());
    }
}
```

**输出：**

```text
[Collections, Java]
Count: 2
```

`map` 清理名称，`filter` 筛选长度，`sorted` 排序，`toList` 收集结果。Java 21 中的 `Stream.toList()` 返回不可修改的列表。

## 汇总与分组

数值计算可以先转换为基本类型流，再调用 `sum()` 等方法。需要按条件分组时，可以使用 `Collectors.groupingBy`：

```java
int totalLength = topics.stream().mapToInt(String::length).sum();

Map<Integer, List<String>> byLength = topics.stream()
        .collect(Collectors.groupingBy(String::length));
```

以上是片段，需要导入 `Map` 和 `Collectors`。分组结果的遍历顺序取决于使用的映射实现。

`reduce` 把元素逐个合并为单一结果：

```java
Optional<Integer> total = List.of(25, 40, 30).stream()
        .reduce(Integer::sum);
```

空流的 `reduce` 返回空 `Optional`；带初始值的形式可以直接返回结果。

## Optional 与缺失值

`Optional` 表示一个可能存在也可能不存在的值，避免把 `null` 当作有效结果传递：

```java
Optional<String> first = topics.stream().findFirst();
String value = first.orElse("none");
```

`orElseGet` 只在值不存在时才计算默认值，`ifPresent` 只在值存在时执行操作。`Optional` 适合表达方法的返回类型，不宜作为字段或参数类型使用。

## 示例：学生成绩统计

```java title="Main.java"
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class Main {
    record Student(String name, int score) {}

    public static void main(String[] args) {
        List<Student> students = List.of(
                new Student("Alex", 95),
                new Student("Bo", 88),
                new Student("Cindy", 82),
                new Student("Dana", 91)
        );

        double average = students.stream()
                .mapToInt(Student::score)
                .average()
                .orElse(0);

        Map<String, List<Student>> byGrade = students.stream()
                .collect(Collectors.groupingBy(
                        student -> student.score() >= 90 ? "A" : "B",
                        TreeMap::new,
                        Collectors.toList()));

        System.out.println("Average: " + average);
        byGrade.forEach((grade, members) ->
                System.out.println(grade + ": " + members.stream().map(Student::name).toList()));
    }
}
```

**输出：**

```text
Average: 89.0
A: [Alex, Dana]
B: [Bo, Cindy]
```

`mapToInt` 把对象流转换为 `IntStream`，`average` 返回 `OptionalDouble`，空流时 `orElse(0)` 提供默认值。`groupingBy` 按分数线分成两组，显式传入 `TreeMap::new` 让分组的输出顺序固定，而不是依赖 `HashMap` 的遍历顺序。`record` 的写法见[面向对象](../../basics/oop.md)。

## 注意事项

- 一个 Stream 只能消费一次，需要再次计算时重新创建流。
- 流中的函数应尽量不修改数据源，也不依赖不断变化的外部状态。
- `parallelStream()` 不保证更快，阻塞操作、共享状态和任务规模都会影响结果。
- `Files.lines()` 等持有外部资源的流需要关闭；普通集合生成的流通常不需要。
- Lambda 的 `this` 指向外层对象，与匿名内部类指向匿名类自身不同。

## 练习

1. 为课程列表增加重复项，清理空白后使用 `distinct()` 去重，再按名称长度排序。为长度相同的名称补充一个明确的排序规则。
2. 用 `reduce` 计算一组学习分钟数的总和，并比较带初始值与不带初始值两种写法的结果类型。

## 参考资料

- [Tpoint Tech：Java Lambda Expressions](https://www.tpointtech.com/java-lambda-expressions)。
- [Java 21 API：Stream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)。
