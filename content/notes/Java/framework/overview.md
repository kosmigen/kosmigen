# Java 框架

框架为一类应用提供组织方式和扩展点，例如创建对象、处理请求或管理事务。学习框架时，需要把业务对象、框架配置和运行环境分别理解。

## 框架与普通库

使用普通库时，应用主动调用它提供的方法。使用框架时，框架通常还会决定部分执行流程，再在约定的位置调用应用代码，这体现了控制反转。

| 常见技术 | 主要职责 |
| --- | --- |
| Spring Framework | 容器、依赖注入、事务、Web 等基础能力 |
| Spring Boot | 在 Spring 生态上简化应用配置、依赖组织和启动 |
| Hibernate | 对象与关系数据库之间的映射和持久化 |

这些技术的职责可以组合，也可能有重叠。学习时先明确当前要解决的问题，再阅读相应模块。

## 依赖注入

依赖注入把“对象需要什么”与“由谁创建这些依赖”分开。构造器注入是一种常见方式：对象通过参数接收协作者，不在内部固定创建某个实现。

## 示例：手动完成构造器注入

这个示例只使用 JDK，先展示依赖注入本身，再进入 Spring 容器的写法。

```java title="Main.java"
interface RecordStore {
    void save(String topic);
}

class ConsoleStore implements RecordStore {
    public void save(String topic) {
        System.out.println("Saved: " + topic);
    }
}

class StudyService {
    private final RecordStore store;

    StudyService(RecordStore store) {
        this.store = store;
    }

    void record(String topic) {
        store.save(topic);
    }
}

public class Main {
    public static void main(String[] args) {
        RecordStore store = new ConsoleStore();
        StudyService service = new StudyService(store);
        service.record("Java");
    }
}
```

**输出：**

```text
Saved: Java
```

`StudyService` 依赖 `RecordStore` 接口，调用方选择 `ConsoleStore` 实现并传入。将来更换存储方式时，可以保留服务的调用逻辑。

## 本部分内容

- [Spring：容器与依赖注入](spring/index.md)：通过 `@Configuration`、`@Bean` 和构造器参数组装对象。

## 注意事项

- 依赖注入是一种对象组织方式，不要求一定使用框架。
- 使用注解前先理解它由谁处理、何时生效，避免只记写法。
- 示例应明确框架版本与运行命令，配置和代码需要能够配套使用。
- 学习框架功能时，保留最小业务对象，便于分辨框架带来的行为。

## 练习

增加一个把数据保存到内存集合的 `RecordStore` 实现，使用构造器把它传给同一个 `StudyService`。说明为什么无需修改 `record()`。

## 参考资料

- [Tpoint Tech：Spring Framework Tutorial](https://www.tpointtech.com/spring-tutorial)。
- [Spring 官方文档：IoC Container and Beans](https://docs.spring.io/spring-framework/reference/core/beans/introduction.html)。
