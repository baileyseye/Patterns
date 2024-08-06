package baileyes.eyes.factory.factory.service.impl;

import baileyes.eyes.factory.factory.service.Product;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConcreteProductB implements Product {

    @Override
    public void use() {
        log.info("Using ConcreteProductB");
    }
}
