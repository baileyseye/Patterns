package baileyes.eyes.bridge.bridge.abstraction;

import baileyes.eyes.bridge.bridge.Abstraction;
import baileyes.eyes.bridge.bridge.Implementor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class RefinedAbstractionB extends Abstraction {

    public RefinedAbstractionB(@Qualifier("concreteImplementorB") Implementor implementor) {
        super(implementor);
    }

    @Override
    public void operation() {
        System.out.print("RefinedAbstractionB: ");
        implementor.operationImpl();
    }
}
