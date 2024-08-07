package baileyes.eyes.bridge.bridge.abstraction;

import baileyes.eyes.bridge.bridge.Animal;
import baileyes.eyes.bridge.bridge.AnimalBehavior;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class HappyDog extends Animal {

    public HappyDog(@Qualifier("dogBehavior") AnimalBehavior animalBehavior) {
        super(animalBehavior);
    }

    @Override
    public void showBehavior() {
        System.out.print("HappyDog: ");

        behavior.performAction();
    }
}
