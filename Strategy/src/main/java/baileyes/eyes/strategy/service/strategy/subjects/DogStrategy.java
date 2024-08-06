package baileyes.eyes.strategy.service.strategy.subjects;

import baileyes.eyes.strategy.entity.Dog;
import baileyes.eyes.strategy.service.AnimalStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DogStrategy implements AnimalStrategy {

    @Override
    public Dog getAnimal() {
        return new Dog();
    }
}