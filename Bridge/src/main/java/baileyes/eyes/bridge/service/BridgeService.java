package baileyes.eyes.bridge.service;

import baileyes.eyes.bridge.bridge.Abstraction;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BridgeService {

    private final List<Abstraction> abstractions;

    public void execute() {
        for (Abstraction abstraction : abstractions) {
            abstraction.operation();
        }
    }
}
