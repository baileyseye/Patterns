package baileyes.eyes.facade.service.system;

import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Component;

@Component
public class SubsystemB {

    public CompletableFuture<String> performTaskB() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "Result from Subsystem B";
        });
    }
}
