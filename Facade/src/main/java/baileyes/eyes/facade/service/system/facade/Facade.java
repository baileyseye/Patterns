package baileyes.eyes.facade.service.system.facade;

import baileyes.eyes.facade.service.system.SubsystemA;
import baileyes.eyes.facade.service.system.SubsystemB;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Facade {

    private final SubsystemA subsystemA;
    private final SubsystemB subsystemB;

    public CompletableFuture<String> performTasks() {
        CompletableFuture<String> taskA = subsystemA.performTaskA();
        CompletableFuture<String> taskB = subsystemB.performTaskB();

        return taskA.thenCombine(taskB, (resultA, resultB) -> resultA + " | " + resultB);
    }
}
