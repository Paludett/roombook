package dev.paludett.roombook.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

class GlobalExceptionHandlerTest {

    record Body(@NotBlank String name, @NotBlank String email) {
    }

    @RestController
    static class Probe {
        @GetMapping("/probe/404")
        void notFound() {
            throw new NotFoundException("Sala 1 não encontrada");
        }

        @GetMapping("/probe/409")
        void conflict() {
            throw new BusinessRuleException("Horário já reservado");
        }

        @PostMapping("/probe/400")
        void validate(@Valid @RequestBody Body body) {
        }
    }

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new Probe())
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void notFoundVira404() throws Exception {
        mvc.perform(get("/probe/404"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Sala 1 não encontrada"));
    }

    @Test
    void regraDeNegocioVira409() throws Exception {
        mvc.perform(get("/probe/409"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Horário já reservado"));
    }

    @Test
    void validacaoVira400ComCampos() throws Exception {
        mvc.perform(post("/probe/400").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors[?(@.field=='name')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists());
    }
}
