# Spring：容器与依赖注入

Spring IoC 容器负责创建、配置和管理对象。交给容器管理的对象称为 Bean；Bean 之间的依赖可以通过构造器、工厂方法参数等方式提供。

本例使用 **JDK 21、Maven、Spring Framework 6.2.12**，通过 Java 配置创建一个最小容器，不涉及 Web 服务。

## 核心概念

| 名称 | 作用 |
| --- | --- |
| `ApplicationContext` | 访问容器中的对象及相关应用能力 |
| `@Configuration` | 声明提供 Bean 定义的配置类 |
| `@Bean` | 将方法创建的对象注册为 Bean |
| `@ComponentScan` | 扫描指定包，注册带组件注解的类 |
| 依赖注入 | 由容器为对象提供它依赖的其他对象 |

Bean 的默认作用域是 singleton，表示同一个容器中相应 Bean 定义通常对应一个共享实例；这不意味着这个类在整个 JVM 中只能有一个对象。

| 作用域 | 行为 |
| --- | --- |
| `singleton` | 容器内共享一个实例，默认值 |
| `prototype` | 每次获取时创建新的实例 |
| `request`、`session` 等 | Web 应用中与请求或会话生命周期绑定 |

## 组件扫描

除了在配置类中逐个声明 `@Bean`，还可以让容器扫描带组件注解的类：

```java
@Component
public class StudyService {
    private final Formatter formatter;

    public StudyService(Formatter formatter) {
        this.formatter = formatter;
    }
}
```

配合 `@ComponentScan("learning")` 或 `@SpringBootApplication` 等入口，容器会自动注册组件并注入其构造器依赖。`@Service`、`@Repository` 等是 `@Component` 的语义化特化，便于按职责区分。

## 生命周期

容器创建 Bean 并完成注入后，会调用标注 `@PostConstruct` 的方法；关闭上下文时，会调用标注 `@PreDestroy` 的方法：

```java
@PostConstruct
void init() {
    // 依赖已注入，完成初始化
}

@PreDestroy
void cleanup() {
    // 容器关闭前执行
}
```

初始化失败会阻止 Bean 投入使用。销毁回调依赖上下文正常关闭，进程被强制终止时不会执行。

## 创建项目

```text
spring-example/
├── pom.xml
└── src/main/java/learning/Main.java
```

将以下内容保存为 `pom.xml`。版本固定用于复现本例：

```xml title="pom.xml"
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>learning</groupId>
    <artifactId>spring-example</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>6.2.12</version>
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

## 示例：让容器组装学习服务

```java title="Main.java"
package learning;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

public class Main {
    public interface Formatter {
        String format(String topic);
    }

    public static class StudyService {
        private final Formatter formatter;

        public StudyService(Formatter formatter) {
            this.formatter = formatter;
        }

        public String start(String topic) {
            return formatter.format(topic);
        }
    }

    @Configuration
    public static class Config {
        @Bean
        public Formatter formatter() {
            return topic -> "Ready: " + topic;
        }

        @Bean
        public StudyService studyService(Formatter formatter) {
            return new StudyService(formatter);
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            StudyService service = context.getBean(StudyService.class);
            System.out.println(service.start("Java"));
        }
    }
}
```

在项目目录执行，首次运行需要下载 Maven 依赖：

```sh
mvn -q compile exec:java -Dexec.mainClass=learning.Main
```

**输出：**

```text
Ready: Java
```

容器先读取配置类，注册两个 Bean，再为 `studyService` 方法的 `Formatter` 参数提供相应对象。业务服务通过构造器接收依赖，自己不需要查找容器。

## 常见配置问题

| 现象 | 可以检查 |
| --- | --- |
| 找不到 Bean | 配置是否被加载，Bean 是否确实注册 |
| 同一类型存在多个候选对象 | 使用名称、`@Qualifier` 或 `@Primary` 明确选择 |
| 注解未产生预期行为 | 是否由容器创建对象，相关处理器是否启用 |
| 容器关闭后资源仍未释放 | Bean 的销毁方法和资源所有权是否清晰 |

## 注意事项

- 普通 `new StudyService(...)` 创建的对象不会自动获得所有容器扩展行为。
- 默认共享 Bean 可能被多个线程调用，需要控制可变状态。
- Spring Framework 与 Spring Boot 的配置入口不同，本例使用前者的基础容器。
- 关闭应用上下文，使容器有机会执行已注册的销毁回调。

## 练习

增加第二种 `Formatter` 实现，观察仅按类型注入时的歧义，再使用 `@Qualifier` 明确选择。保留服务类，让变化集中在配置中。

## 参考资料

- [Tpoint Tech：Spring Framework Tutorial](https://www.tpointtech.com/spring-tutorial)。
- [Spring 官方文档：@Bean 与 @Configuration](https://docs.spring.io/spring-framework/reference/core/beans/java/basic-concepts.html)。
