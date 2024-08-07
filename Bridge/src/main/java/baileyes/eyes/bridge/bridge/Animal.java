package baileyes.eyes.bridge.bridge;

public abstract class Animal {

    protected AnimalBehavior behavior;

    protected Animal(AnimalBehavior behavior) {
        this.behavior = behavior;
    }

    public abstract void showBehavior();
}
