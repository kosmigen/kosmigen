# 并发编程

并发编程用于组织多个可以独立推进的任务。任务可以在时间上交错执行，也可以在不同处理器核心上同时执行；前者涉及并发，后者涉及并行。

## 线程与任务

`Thread` 表示线程，`Runnable` 描述不返回结果的任务。`Callable<V>` 可以返回结果，也可以声明受检异常。

创建任务有两种常见方式：

| 方式 | 说明 |
| --- | --- |
| 继承 `Thread` 并重写 `run()` | 直接，但占用单继承位置，任务与线程机制耦合 |
| 实现 `Runnable` 传给 `Thread` 或执行器 | 任务与线程分离，可以复用同一份任务代码 |

**语法：**

```java
Thread worker = new Thread(() -> System.out.println("Working"));
worker.start();
worker.join();
```

`start()` 启动新线程，直接调用 `run()` 只是当前线程中的普通方法调用。`join()` 等待目标线程结束。

| 方法 | 作用 |
| --- | --- |
| `start()` | 启动线程并执行 `run()` |
| `join()` | 等待线程结束，可带超时 |
| `sleep(millis)` | 让当前线程休眠，可能被中断提前唤醒 |
| `interrupt()` | 请求目标线程中断 |
| `isAlive()` | 线程是否已启动且尚未结束 |
| `getState()` | 查询线程状态 |

线程状态包括 `NEW`、`RUNNABLE`、`BLOCKED`、`WAITING`、`TIMED_WAITING` 和 `TERMINATED`。`RUNNABLE` 既可能表示正在执行，也可能表示等待获得处理器时间。

## 共享状态与同步

多个线程操作同一份可变数据时，需要同时考虑：

| 问题 | 含义 |
| --- | --- |
| 原子性 | 一组操作是否会被其他线程插入干扰 |
| 可见性 | 一个线程的写入何时能被其他线程观察到 |
| 顺序约束 | 操作之间建立了哪些可靠的先后关系 |

`synchronized` 可以保护临界区：

```java
class Counter {
    private int value;

    synchronized void add(int amount) {
        value += amount;
    }

    synchronized int value() {
        return value;
    }
}
```

方法上的 `synchronized` 以当前对象为锁；同一个对象的同步方法同一时间只允许一个线程执行。锁粒度需要平衡：过大的临界区会降低并发度，过小则可能留下未保护的读写路径。

`java.util.concurrent.locks.Lock` 提供更灵活的加锁能力，例如跨方法解锁和尝试加锁；原子类提供特定的原子操作；`volatile` 提供可见性与相应的顺序约束。但 `volatile int count` 不能使 `count++` 自动成为原子操作。

多个线程并发访问集合时，可以使用 `ConcurrentHashMap`、`BlockingQueue` 等并发集合；`Collections.synchronizedList` 等方式返回的包装器仍需在外层手动同步迭代等复合操作。

## 示例一：安全累计计数

```java title="Main.java"
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger count = new AtomicInteger();
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                count.incrementAndGet();
            }
        };

        Thread first = new Thread(task);
        Thread second = new Thread(task);
        first.start();
        second.start();
        first.join();
        second.join();

        System.out.println("Count: " + count.get());
    }
}
```

**输出：**

```text
Count: 2000
```

原子自增避免了更新丢失，两个 `join()` 确保主线程在所有累加完成后读取结果。线程内部的执行先后顺序不影响本例最终结果。

## 执行器与异步结果

`ExecutorService` 接收并调度任务，`Future` 表示尚未获得或已经获得的结果。`CompletableFuture` 进一步支持结果转换、任务组合和异常恢复。

### 示例二：合并两个任务的结果

本例使用 JDK 21 的执行器自动关闭能力：

```java title="Main.java"
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
            CompletableFuture<Integer> reading =
                    CompletableFuture.supplyAsync(() -> 25, pool);
            CompletableFuture<Integer> coding =
                    CompletableFuture.supplyAsync(() -> 35, pool);

            int total = reading.thenCombine(coding, Integer::sum).get();
            System.out.println("Total minutes: " + total);
        }
    }
}
```

**输出：**

```text
Total minutes: 60
```

`thenCombine` 在两个结果都可用时进行合并。`get()` 等待结果，因此这里是“异步启动任务，在最后同步等待”。异步不意味着调用链中不存在阻塞。

## 虚拟线程

Java 21 正式提供虚拟线程，可以通过 `Thread.ofVirtual()` 或 `Executors.newVirtualThreadPerTaskExecutor()` 使用。它们适合承载大量需要等待 IO 的任务，不会使 CPU 密集计算自动加速，也不改变共享状态的同步要求。

并发任务的数量与下游容量仍需协调，例如数据库连接数和远端服务的承载能力。

## 注意事项

- 线程池需要关闭；还应明确排队容量、任务超时与拒绝策略。
- 取消任务不等于任务一定已经停止，需要任务代码配合处理中断或取消信号。
- `Future.get()` 的失败、等待超时和线程中断是不同情况，应分别处理。
- 使用锁时保持一致的获取顺序，避免持锁执行不必要的长时间阻塞操作。
- 不要让线程悄悄吞掉中断；响应中断时应恢复中断标记或明确结束任务。

## 练习

1. 为两个异步任务增加失败分支，使用 `exceptionally` 提供一个明确的替代值。说明替代值会不会掩盖真实失败，以及调用方如何识别这类结果。
2. 把示例一改成 `synchronized` 计数器版本，比较两种写法需要维护的代码，以及误把 `volatile` 当作原子操作时可能出现的输出。

## 参考资料

- [Tpoint Tech：Multithreading in Java](https://www.tpointtech.com/multithreading-in-java)。
- [Java 21 API：java.util.concurrent](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)。
