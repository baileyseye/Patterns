package baileyes.eyes.bridge.bridge.impl;

import baileyes.eyes.bridge.bridge.Implementor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ConcreteImplementorB implements Implementor {

    @Override
    public void operationImpl() {
        log.info("ConcreteImplementorB: operationImpl");
    }
}