package baileyes.eyes.facade.service;

import baileyes.eyes.facade.service.system.facade.Facade;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AsyncService {

    private final Facade facade;

    @Async
    public CompletableFuture<String> executeAsyncTasks() {
        return facade.performTasks();
    }
}
