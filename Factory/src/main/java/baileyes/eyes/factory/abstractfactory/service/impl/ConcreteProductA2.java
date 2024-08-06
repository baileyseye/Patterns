package baileyes.eyes.factory.abstractfactory.service.impl;

import baileyes.eyes.factory.abstractfactory.service.ProductA;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConcreteProductA2 implements ProductA {

    @Override
    public void use() {
        log.info("Using ConcreteProductA2");
    }
}
