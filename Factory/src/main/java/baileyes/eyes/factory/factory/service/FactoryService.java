package baileyes.eyes.factory.factory.service;

import baileyes.eyes.factory.factory.service.impl.creator.ConcreteCreatorA;
import baileyes.eyes.factory.factory.service.impl.creator.ConcreteCreatorB;
import org.springframework.stereotype.Service;

@Service
public class FactoryService {

    public void execute() {
        Creator creatorA = new ConcreteCreatorA();
        creatorA.someOperation();

        Creator creatorB = new ConcreteCreatorB();
        creatorB.someOperation();
    }
}
