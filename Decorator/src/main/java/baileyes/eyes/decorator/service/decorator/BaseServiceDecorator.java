package baileyes.eyes.decorator.service.decorator;

import baileyes.eyes.decorator.dto.RandomDataDTO;
import baileyes.eyes.decorator.service.BaseService;

public abstract class BaseServiceDecorator extends BaseService {

    protected BaseService baseService;

    protected BaseServiceDecorator(BaseService baseService) {
        this.baseService = baseService;
    }

    @Override
    public RandomDataDTO performAction() {
        return baseService.performAction();
    }
}
