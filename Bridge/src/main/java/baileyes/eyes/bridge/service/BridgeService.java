package baileyes.eyes.bridge.service;

import baileyes.eyes.bridge.bridge.Animal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BridgeService {

    private final List<Animal> animals;

    public void execute() {
        for (Animal animal : animals) {
            animal.showBehavior();
        }
    }
}
