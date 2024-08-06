package baileyes.eyes.factory.abstractfactory.service.impl;

import baileyes.eyes.factory.abstractfactory.service.ProductB;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConcreteProductB2 implements ProductB {

    @Override
    public void use() {
        log.info("Using ConcreteProductB2");
    }
}
