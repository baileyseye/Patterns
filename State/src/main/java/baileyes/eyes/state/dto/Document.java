package baileyes.eyes.state.dto;

import baileyes.eyes.state.state.enam.DocumentState;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Setter
@Getter
@Component
public class Document {

    private DocumentState state;

    public Document() {
        this.state = DocumentState.UNDER_REVIEW;
    }

    public void review() {
        state = state.review(this);
    }

    public void confirm() {
        state = state.confirm(this);
    }

    public void reject() {
        state = state.reject(this);
    }
}
