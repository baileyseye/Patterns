package baileyes.eyes.adapter.service;

import baileyes.eyes.adapter.adapter.Target;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdapterService {

    private final Target target;

    public String execute() {
        return target.request();
    }
}
