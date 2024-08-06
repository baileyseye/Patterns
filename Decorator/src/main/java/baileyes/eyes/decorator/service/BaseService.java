package baileyes.eyes.decorator.service;

import baileyes.eyes.decorator.dto.RandomDataDTO;
import baileyes.eyes.decorator.service.decorator.impl.FirstDecorator;
import baileyes.eyes.decorator.service.decorator.impl.SecondDecorator;
import org.springframework.stereotype.Service;

@Service
public class BaseService {

    public RandomDataDTO performAction() {
        return new RandomDataDTO("Base Service Data");
    }

    public RandomDataDTO performDecoratedAction() {
        BaseService firstDecorator = new FirstDecorator(this);
        BaseService secondDecorator = new SecondDecorator(firstDecorator);

        return secondDecorator.performAction();
    }
}
