package baileyes.eyes.bridge.bridge.abstraction;

import baileyes.eyes.bridge.bridge.Animal;
import baileyes.eyes.bridge.bridge.AnimalBehavior;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class HappyCat extends Animal {

    public HappyCat(@Qualifier("catBehavior") AnimalBehavior animalBehavior) {
        super(animalBehavior);
    }

    @Override
    public void showBehavior() {
        System.out.print("HappyCat: ");

        behavior.performAction();
    }
}
