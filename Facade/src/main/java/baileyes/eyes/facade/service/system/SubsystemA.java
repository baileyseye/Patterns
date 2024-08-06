package baileyes.eyes.facade.service.system;

import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Component;

@Component
public class SubsystemA {

    public CompletableFuture<String> performTaskA() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "Result from Subsystem A";
        });
    }
}
