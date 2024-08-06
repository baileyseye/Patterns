package baileyes.eyes.patterns.chain.entity;

import baileyes.eyes.patterns.chain.entity.dto.ProcessDataDto;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChainManager {

    private final List<ChainPart> chain;

    public void addSomething(UUID id, ProcessDataDto<?> processDataDto) {
        ProcessDataDto<?> process = ProcessDataDto.builder()
            .id(id)
            .data(processDataDto.getData())
            .build();

        for (var chainPart : chain) {
            process = chainPart.process(process);
        }
    }

    public void getSomething(UUID id, ProcessDataDto<?> processDataDto) {
        ProcessDataDto<?> tempData = processDataDto;

        for (var chainPart : chain) {
            tempData = chainPart.process(tempData);
        }

        ProcessDataDto.builder()
            .id(id)
            .data(tempData.getData())
            .build();
    }
}
