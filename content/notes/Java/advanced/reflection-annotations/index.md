# 反射与注解

反射允许程序在运行时查询类型信息、查找成员并执行相应操作。注解则把结构化元数据附加到类、方法或字段等位置，供编译器、工具或运行时代码读取。

## Class 与反射对象

**语法：**

```java
Class<String> type = String.class;
Class<?> actualType = object.getClass();
Class<?> loadedType = Class.forName("java.lang.String");
```

`Class` 表示运行时的类型。`Method`、`Field` 和 `Constructor` 分别表示方法、字段和构造器。

| 操作 | 常用 API |
| --- | --- |
| 获取公开方法 | `getMethod`、`getMethods` |
| 获取当前类声明的方法 | `getDeclaredMethod`、`getDeclaredMethods` |
| 查找构造器 | `getConstructor`、`getDeclaredConstructor` |
| 执行方法 | `Method.invoke` |
| 创建对象 | `Constructor.newInstance` |
| 查询字段 | `getField`、`getDeclaredField`、`getDeclaredFields` |
| 类型信息 | `getName`、`getSimpleName`、`getSuperclass`、`getInterfaces` |

`getMethods()` 包括可见的继承公开方法，`getDeclaredMethods()` 主要查询当前类声明的方法。`getDeclaredFields()` 等按名称查询的 API 不保证返回顺序，需要固定顺序时自行排序。找到成员不代表已经获得调用它的权限。

## 注解的声明

注解类型通过 `@interface` 声明。注解可以携带元素，元素可以有默认值：

```java
@interface Course {
    String name();
    int hours() default 10;
}
```

按元素数量，注解分为标记注解（没有元素）、单值注解（只有一个 `value()` 元素）和多值注解。单值注解在使用时可以省略元素名，例如 `@Course("Java")` 等价于 `@Course(value = "Java")`。

注解元素支持的类型有限：基本类型、`String`、`Class`、枚举、其他注解，以及这些类型的数组。

## 内置注解与元注解

| 注解 | 作用 |
| --- | --- |
| `@Override` | 检查方法是否覆盖父类型的方法 |
| `@Deprecated` | 标记不建议继续使用的 API |
| `@SuppressWarnings` | 抑制指定编译警告，应限定范围 |
| `@Target` | 规定可以标注的程序元素，如方法、字段、类型 |
| `@Retention` | 规定保留到源码、类文件还是运行时 |
| `@Documented` | 让注解出现在 javadoc 生成的文档中 |
| `@Inherited` | 子类可以继承父类上的注解，仅对类注解有效 |

需要运行时反射读取的自定义注解，应使用 `RetentionPolicy.RUNTIME`。注解本身不会自动执行逻辑，需要相应的处理代码。

## 示例：读取方法说明并调用方法

```java title="Main.java"
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Method;

public class Main {
    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.METHOD)
    public @interface Topic {
        String value();
    }

    public static class Lesson {
        @Topic("Reflection")
        public String describe() {
            return "Read metadata, then call the method.";
        }
    }

    public static void main(String[] args) throws ReflectiveOperationException {
        Lesson lesson = new Lesson();
        Method method = Lesson.class.getMethod("describe");
        Topic topic = method.getAnnotation(Topic.class);

        System.out.println("Topic: " + topic.value());
        System.out.println(method.invoke(lesson));
    }
}
```

**输出：**

```text
Topic: Reflection
Read metadata, then call the method.
```

示例明确知道注解存在，所以直接读取 `value()`。处理任意类型时，应检查 `getAnnotation()` 是否返回 `null`。

## 示例：读取私有字段

```java title="Main.java"
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Comparator;

public class Main {
    public static class Lesson {
        private final String title;
        private final int pages;

        public Lesson(String title, int pages) {
            this.title = title;
            this.pages = pages;
        }
    }

    public static void main(String[] args) throws ReflectiveOperationException {
        Lesson lesson = new Lesson("Java IO", 12);
        Class<?> type = lesson.getClass();

        System.out.println("Class: " + type.getSimpleName());
        Field[] fields = type.getDeclaredFields();
        Arrays.sort(fields, Comparator.comparing(Field::getName));
        for (Field field : fields) {
            field.setAccessible(true);
            System.out.println(field.getName() + " = " + field.get(lesson));
        }
    }
}
```

**输出：**

```text
Class: Lesson
pages = 12
title = Java IO
```

`getDeclaredFields` 的返回顺序没有保证，按名称排序后输出才固定。私有字段默认不能访问，`setAccessible(true)` 请求绕过检查；现代 Java 的模块边界可能限制这种操作，业务代码应优先使用公开 API。

## 编译期与运行时处理

编译期注解处理器可以检查源码并生成代码；运行时框架可以通过反射读取保留的元数据，再注册组件或执行调用。两者发生的阶段不同，也有不同的性能和部署特点。

`setAccessible(true)` 不保证能够绕过所有限制；优先使用公开 API，确有需要时再理解模块开放规则。

## 注意事项

- `Method.invoke` 中被调用方法抛出的异常会包装为 `InvocationTargetException`，可通过原因链查看原始异常。
- 反射按名称查找成员，重命名和参数类型变化可能导致运行时失败。
- `getDeclaredMethod` 不会自动遍历所有父类的声明。
- 不要通过反射直接修改对象内部状态来替代正常的业务接口。
- 读取注解前先判断 `getAnnotation` 是否返回 `null`，不能假设所有元素都被标注。

## 练习

1. 给 `Lesson` 增加一个没有 `@Topic` 的公开方法，遍历声明的方法，仅输出带有注解的方法名称。为查询结果自行排序。
2. 给 `@Course` 增加 `hours()` 默认值，标注两个课程并分别省略、覆盖 `hours` 元素，通过反射读取并比较结果。

## 参考资料

- [Tpoint Tech：Java Reflection API](https://www.tpointtech.com/java-reflection)。
- [Tpoint Tech：Java Annotations](https://www.tpointtech.com/java-annotations)。
- [Java 21 API：Class](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html)。
