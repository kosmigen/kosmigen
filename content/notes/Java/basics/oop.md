# 面向对象

面向对象编程通过对象组织状态与行为。类描述一类对象具有哪些字段和方法，对象则保存一次具体使用中的状态。

## 类与对象

**语法：**

```java
class 类名 {
    // 字段
    // 构造器
    // 方法
}
```

使用 `new` 创建对象时会调用构造器。构造器与类同名，没有返回类型；`this` 表示当前对象，可以用来区分字段与同名参数：

```java
class Task {
    private final String name;

    Task(String name) {
        this.name = name; // this.name 是字段，name 是参数
    }

    String name() {
        return name;
    }
}
```

构造器之间可以用 `this(...)` 相互调用，父类构造器用 `super(...)` 调用。没有显式构造器时，编译器会提供无参构造器；一旦写出任意构造器，无参构造器就不再自动生成。

`static` 成员属于类：静态字段由类的所有实例共享，静态方法不依赖某个实例。`final` 字段只能赋值一次，通常在构造器中完成初始化。

### 记录类

只承载数据的类可以使用 `record` 声明：

```java
record Point(int x, int y) {}
```

记录类自动生成构造器、`equals`、`hashCode` 和 `toString` 等成员，字段是私有的 `final` 类型。它适合值对象等不可变数据，业务对象仍使用普通类。

## 面向对象的主要机制

| 概念 | 作用 |
| --- | --- |
| 封装 | 通过字段可见性和方法维护对象状态的有效性 |
| 继承 | 通过 `extends` 建立已有类与新类的关系 |
| 抽象 | 用接口或抽象类描述调用方需要的能力 |
| 多态 | 调用相同接口时，根据实际对象执行不同的实现 |
| 组合 | 一个对象持有并使用其他对象，协作完成任务 |

## 访问控制

| 修饰方式 | 可访问范围 |
| --- | --- |
| `public` | 满足类型可见性及模块规则的外部代码 |
| `protected` | 同包代码，以及符合访问规则的子类代码 |
| 不写访问修饰符 | 同一个包 |
| `private` | 声明它的顶层类所包含的代码范围 |

封装不仅是添加 getter 和 setter。对象的方法应维护规则，例如余额不能随意变成负数，学习时长不能无条件减少。字段默认保持 `private`，确实需要暴露的能力再通过方法公开。

## 继承

继承通过 `extends` 复用父类的字段和方法，并允许子类扩展或改变行为。Java 类只能直接继承一个类，所有类都直接或间接继承 `java.lang.Object`：

```java
class ReadingTask extends Task {
    ReadingTask(String name) {
        super(name); // 先调用父类构造器
    }
}
```

子类可以重写父类的方法，`@Override` 让编译器检查是否确实覆盖了目标声明。重写时可以调用 `super.方法名(...)` 使用父类实现。`final` 方法不能被重写，`final` 类不能被继承。

`toString`、`equals` 和 `hashCode` 都定义在 `Object` 中。默认的 `toString` 输出类型名和哈希码，默认的 `equals` 比较引用身份；需要按内容比较时应在类中重写，并保持 `equals` 与 `hashCode` 的约定一致，否则会影响哈希集合中的行为，见[集合框架](collections.md)。

## 抽象

抽象类可以声明没有方法体的抽象方法，也可以提供已实现的普通方法：

```java
abstract class Task {
    private final String name;

    Task(String name) {
        this.name = name;
    }

    abstract int minutes(); // 子类必须实现
}
```

接口描述调用方需要的能力，可以声明抽象方法、默认方法和静态方法：

```java
interface StudyTask {
    String summary();

    default boolean isLong(int minutes) {
        return minutes > 60;
    }
}
```

`default` 方法为已有接口提供带默认实现的新能力，实现类可以覆盖它。一个类可以实现多个接口，同时还可以继承一个类。只有一个抽象方法的接口称为函数式接口，可以用 Lambda 表达式实现，见[函数式编程](../advanced/functional/index.md)。

## 多态

声明类型与对象实际类型不同时，实例方法调用按实际类型执行：

```java
Task task = new ReadingTask("Java basics", 12);
System.out.println(task.report()); // 执行 ReadingTask 定义的实现
```

这种按运行时类型分派的能力让调用方只依赖 `Task` 的约定，新增加任务类型时调用代码不需要修改。静态方法、字段访问和重载方法的选择不按这种方式分派。

## 重载与重写

| 比较项 | 重载 | 重写 |
| --- | --- | --- |
| 发生位置 | 同一类型可见的方法集合中 | 子类或接口实现关系中 |
| 方法名 | 相同 | 相同 |
| 参数 | 参数列表不同 | 与被重写方法匹配 |
| 选择依据 | 主要在编译期根据参数类型选择 | 实例方法调用可在运行时根据对象选择实现 |

仅改变返回类型不能形成方法重载。重写时建议使用 `@Override`，让编译器检查方法是否确实覆盖了目标声明。重写方法的返回类型可以是被重写方法返回类型的子类型，访问权限不能更低，受检异常声明不能更宽。

## 关联、聚合与组合

对象之间的关系按生命周期的耦合程度区分：

| 关系 | 含义 | 示例 |
| --- | --- | --- |
| 关联 | 对象之间互相认识并使用 | 学生知道授课教师 |
| 聚合 | 整体持有部分，部分可以脱离整体存在 | 班级持有学生列表 |
| 组合 | 整体负责部分的完整生命周期 | 订单持有订单项，订单项不脱离订单使用 |

优先使用松散的关联与组合。继承适合稳定的“是一种”关系，组合适合复用协作能力；两者可以同时出现。

## 示例：通过接口安排学习任务

```java title="Main.java"
interface StudyTask {
    String summary();
}

class ReadingTask implements StudyTask {
    private final String title;
    private final int pages;

    ReadingTask(String title, int pages) {
        if (pages <= 0) {
            throw new IllegalArgumentException("pages must be positive");
        }
        this.title = title;
        this.pages = pages;
    }

    @Override
    public String summary() {
        return title + ": " + pages + " pages";
    }
}

public class Main {
    public static void main(String[] args) {
        StudyTask task = new ReadingTask("Java basics", 12);
        System.out.println(task.summary());
    }
}
```

**输出：**

```text
Java basics: 12 pages
```

`task` 的声明类型是 `StudyTask`，实际对象是 `ReadingTask`。调用 `summary()` 时执行实际对象的实现，这体现了接口多态。字段通过 `private final` 限制访问和重新赋值，构造器负责检查页数，异常机制见[异常处理](exception.md)。

## 示例：抽象任务与多态

```java title="Main.java"
abstract class Task {
    private final String name;

    Task(String name) {
        this.name = name;
    }

    String name() {
        return name;
    }

    abstract int minutes();

    String report() {
        return name + " takes " + minutes() + " minutes";
    }
}

class ReadingTask extends Task {
    private final int pages;

    ReadingTask(String name, int pages) {
        super(name);
        this.pages = pages;
    }

    @Override
    int minutes() {
        return pages * 3;
    }
}

class CodingTask extends Task {
    private final int problems;

    CodingTask(String name, int problems) {
        super(name);
        this.problems = problems;
    }

    @Override
    int minutes() {
        return problems * 15;
    }
}

public class Main {
    public static void main(String[] args) {
        Task[] tasks = {
            new ReadingTask("Java basics", 12),
            new CodingTask("Loop practice", 3)
        };
        for (Task task : tasks) {
            System.out.println(task.report());
        }
    }
}
```

**输出：**

```text
Java basics takes 36 minutes
Loop practice takes 45 minutes
```

`Task` 是抽象类，`minutes()` 没有实现，两个子类分别按页数和题目数计算时长。`report()` 定义在 `Task` 中，调用 `minutes()` 时按实际对象分派到子类实现。数组里的声明类型都是 `Task`，循环中的调用体现了多态。

## 注意事项

- Java 方法参数始终按值传递；传入对象时复制的是引用的值。
- 实例字段属于各自的对象，静态字段由类的实例共享使用。
- `protected` 的跨包访问有额外限制，不能简单理解成任何子类都能访问任意父类对象的字段。
- 设计继承关系时需要保证子类符合父类型的使用约定；无法保证时应改用组合。
- 重写 `equals` 必须同时重写 `hashCode`，保证相等对象的哈希码相同。
- 记录类自动生成 `equals` 和 `hashCode`，但其字段仍可持有可变对象。

## 练习

1. 新增一个实现 `StudyTask` 的 `CodingTask`，让 `summary()` 返回练习名称和题目数量。将两种任务放进同一个数组，统一调用 `summary()`。
2. 给抽象任务示例增加 `VideoTask`，按视频数量乘以 20 分钟计算时长，并让 `report()` 输出“学习视频”类型名。

## 参考资料

- [Tpoint Tech：OOPs Concepts in Java](https://www.tpointtech.com/java-oops-concepts)。
- [Java 21 语言规范：Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)。
