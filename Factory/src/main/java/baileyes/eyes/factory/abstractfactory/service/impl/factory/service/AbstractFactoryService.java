package baileyes.eyes.factory.abstractfactory.service.impl.factory.service;

import baileyes.eyes.factory.abstractfactory.service.AbstractFactory;
import baileyes.eyes.factory.abstractfactory.service.ProductA;
import baileyes.eyes.factory.abstractfactory.service.ProductB;
import baileyes.eyes.factory.abstractfactory.service.impl.factory.ConcreteFactory1;
import baileyes.eyes.factory.abstractfactory.service.impl.factory.ConcreteFactory2;
import org.springframework.stereotype.Service;

@Service
public class AbstractFactoryService {

    public void execute() {
        firstFactory();
        secondFactory();
    }

    private void secondFactory() {
        AbstractFactory factory2 = new ConcreteFactory2();
        ProductA productA2 = factory2.createProductA();
        ProductB productB2 = factory2.createProductB();
        productA2.use();
        productB2.use();
    }

    private void firstFactory() {
        AbstractFactory factory1 = new ConcreteFactory1();
        ProductA productA1 = factory1.createProductA();
        ProductB productB1 = factory1.createProductB();
        productA1.use();
        productB1.use();
    }
}