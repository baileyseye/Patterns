package baileyes.eyes.bridge.bridge.impl;

import baileyes.eyes.bridge.bridge.AnimalBehavior;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CatBehavior implements AnimalBehavior {

    @Override
    public void performAction() {
        log.info("CatBehavior: performAction");
    }
}
