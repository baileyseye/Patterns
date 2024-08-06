package baileyes.eyes.strategy.service.strategy.subjects;

import baileyes.eyes.strategy.entity.Cat;
import baileyes.eyes.strategy.service.AnimalStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CatStrategy implements AnimalStrategy {

    @Override
    public Cat getAnimal() {
        return new Cat();
    }
}
