# Gson：对象与 JSON 转换

Gson 用于在 Java 对象和 JSON 文本之间进行转换。把对象转换成 JSON 称为序列化，把 JSON 转换成对象称为反序列化。

本例使用 **JDK 21、Maven、Gson 2.13.2**。先完成一个单对象的往返转换，再了解泛型与数据校验方面的区别。

## 基本 API

| 方法 | 用途 |
| --- | --- |
| `new Gson()` | 创建使用默认配置的转换器 |
| `toJson(value)` | 将值转换为 JSON 文本 |
| `fromJson(text, Type.class)` | 将 JSON 转换为指定类型 |
| `GsonBuilder` | 配置字段处理、格式化和类型适配器等行为 |
| `TypeToken` | 描述列表等带类型参数的目标类型 |

`GsonBuilder` 常用配置：

| 配置 | 作用 |
| --- | --- |
| `setPrettyPrinting()` | 输出带缩进和换行的 JSON |
| `serializeNulls()` | 保留值为 `null` 的字段，默认省略 |
| `setFieldNamingPolicy(...)` | 统一转换字段命名风格 |
| `registerTypeAdapter(...)` | 为特定类型提供自定义转换 |

字段名与 JSON 键不同时，使用 `@SerializedName`：

```java
public class ExternalRecord {
    @SerializedName("topic_name")
    String topic;
    @SerializedName("minutes_spent")
    int minutes;
}
```

`new GsonBuilder().setPrettyPrinting().create()` 创建美化输出的转换器，上面类转换的结果：

```text
{
  "topic_name": "Java",
  "minutes_spent": 40
}
```

## 创建项目

```text
gson-example/
├── pom.xml
└── src/main/java/learning/Main.java
```

将以下内容保存为 `pom.xml`：

```xml title="pom.xml"
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>learning</groupId>
    <artifactId>gson-example</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.13.2</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.5.0</version>
            </plugin>
        </plugins>
    </build>
</project>
```

## 示例：转换一条学习记录

```java title="Main.java"
package learning;

import com.google.gson.Gson;

public class Main {
    public record StudyRecord(String topic, int minutes) {}

    public static void main(String[] args) {
        Gson gson = new Gson();
        StudyRecord original = new StudyRecord("Java", 40);

        String json = gson.toJson(original);
        StudyRecord restored = gson.fromJson(json, StudyRecord.class);

        System.out.println(json);
        System.out.println(restored.topic() + " / " + restored.minutes());
    }
}
```

在项目目录执行，首次运行需要下载 Maven 依赖：

```sh
mvn -q compile exec:java -Dexec.mainClass=learning.Main
```

**输出：**

```text
{"topic":"Java","minutes":40}
Java / 40
```

`StudyRecord` 是记录类，用于表达一组数据。`toJson` 输出字段数据，`fromJson` 根据目标类型重新创建记录。JSON 对象字段的排列顺序不应作为业务协议的一部分。

## 泛型类型

需要读取 `List<StudyRecord>` 时，单独传入 `List.class` 无法完整表达元素类型。可以使用 `TypeToken` 保存参数化类型：

```java
TypeToken<List<StudyRecord>> type = new TypeToken<>() {};
List<StudyRecord> records = gson.fromJson(jsonArray, type.getType());
```

此片段需要导入 `java.util.List` 与 `com.google.gson.reflect.TypeToken`，`jsonArray` 应为一个 JSON 数组字符串。类型参数的基础见[泛型](../../basics/generics.md)。

## 转换与校验

JSON 格式正确并不表示业务数据有效。例如，负数分钟数可能能够转换成 `int`，但不符合学习记录的规则。转换之后仍需检查字段范围、必填项和业务约束。

日期时间等类型也应明确格式和时区策略，必要时提供类型适配器。不要把对 JDK 内部字段的深层反射当作稳定的数据格式约定。

## 注意事项

- 明确缺失字段与显式 `null` 的处理方式，并为边界输入增加检查。
- 默认序列化通常会省略值为 `null` 的对象字段，可通过配置调整。
- 无效 JSON 或不匹配的数据类型可能导致转换异常，调用方需要处理失败。
- 泛型容器应提供完整目标类型，避免先读成无类型映射再大量强制转换。

## 练习

将示例改为包含两条记录的 JSON 数组，使用 `TypeToken` 还原列表，并计算总时长。为负数分钟数增加业务校验。

## 参考资料

- [Tpoint Tech：Convert Java Object to JSON Using Gson](https://www.tpointtech.com/convert-java-object-to-json-using-gson)。
- [Gson 官方项目与文档入口](https://github.com/google/gson)。
