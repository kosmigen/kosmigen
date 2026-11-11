# Java 第三方库

第三方库是在 JDK 标准库之外引入的代码，用于补充 JSON 处理、测试、文件格式解析等能力。使用之前，需要知道库负责什么、怎样加入项目，以及输入输出遵循什么约定。

## 依赖与导入

`import` 使源码可以使用类型的简单名称，但不会下载对应的库。使用 Maven 时，依赖通过项目的 `pom.xml` 声明，再由构建工具解析和下载。

| 坐标 | 含义 |
| --- | --- |
| `groupId` | 发布组织或项目的分组标识 |
| `artifactId` | 具体构件名称 |
| `version` | 构件版本 |

例如，Gson 的 Maven 依赖可以写成：

```xml
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.13.2</version>
</dependency>
```

## 示例：从依赖到 API 调用

依赖加入项目后，源码通过 `import com.google.gson.Gson` 引入类型，再调用 `toJson` 或 `fromJson` 完成数据转换。

完整项目、示例与输出见 [Gson：对象与 JSON 转换](gson/index.md)。该页面固定示例依赖版本，并提供可直接运行的 Maven 配置。

## 传递依赖

一个库也可能依赖其他库，构建工具会解析这些传递依赖。同一个构件出现多个版本时，实际选择结果应通过依赖树检查：

```sh
mvn dependency:tree
```

编译通过不代表运行环境一定包含全部依赖；发布应用时还需要确认类路径、模块路径和打包方式。

## 注意事项

- 先检查库支持的 Java 版本，再确认它与当前项目的其他依赖是否兼容。
- 示例中明确版本，避免运行结果随着依赖解析悄悄变化。
- 不同库对 `null`、日期、泛型和未知字段的处理可能不同，需要查阅约定。
- 依赖升级时重新运行相关示例和应用检查，关注不兼容变化。

## 练习

创建 Gson 示例项目，运行 `mvn dependency:tree`，区分自己声明的直接依赖与构建工具解析出的传递依赖。

## 参考资料

- [Tpoint Tech：Convert Java Object to JSON Using Gson](https://www.tpointtech.com/convert-java-object-to-json-using-gson)。
- [Gson 官方项目](https://github.com/google/gson)。
