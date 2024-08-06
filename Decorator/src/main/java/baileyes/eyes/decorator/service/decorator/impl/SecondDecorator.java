package baileyes.eyes.decorator.service.decorator.impl;

import baileyes.eyes.decorator.dto.RandomDataDTO;
import baileyes.eyes.decorator.service.BaseService;
import baileyes.eyes.decorator.service.decorator.BaseServiceDecorator;

public class SecondDecorator extends BaseServiceDecorator {

    public SecondDecorator(BaseService baseService) {
        super(baseService);
    }

    @Override
    public RandomDataDTO performAction() {
        RandomDataDTO result = super.performAction();
        result.setData(result.getData() + " + Second Decorator Data");

        return result;
    }
}
