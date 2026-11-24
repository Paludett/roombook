package dev.paludett.roombook.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Sobe só o MVC (sem banco) com a CorsConfig real.
@SpringJUnitWebConfig(CorsConfigTest.Cfg.class)
class CorsConfigTest {

    private static final String ALLOWED = "http://localhost:4200";

    @RestController
    static class Dummy {
        @GetMapping("/ping")
        String ping() {
            return "ok";
        }
    }

    @Configuration
    @EnableWebMvc
    static class Cfg {
        @Bean
        Dummy dummy() {
            return new Dummy();
        }

        @Bean
        WebMvcConfigurer cors() {
            return new CorsConfig(new String[] {ALLOWED});
        }
    }

    private MockMvc mvc;

    @BeforeEach
    void setUp(WebApplicationContext ctx) {
        mvc = MockMvcBuilders.webAppContextSetup(ctx).build();
    }

    private MockHttpServletRequestBuilder preflight(String origin) {
        return options("/ping")
                .header(HttpHeaders.ORIGIN, origin)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET");
    }

    @Test
    void preflightComOrigemPermitidaRetorna200ComHeader() throws Exception {
        mvc.perform(preflight(ALLOWED))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED));
    }

    @Test
    void preflightComOrigemNaoPermitidaRetorna403() throws Exception {
        mvc.perform(preflight("http://evil.example")).andExpect(status().isForbidden());
    }

    @Test
    void openApiTemTituloRoombookApi() {
        assertThat(new OpenApiConfig().roombookOpenApi().getInfo().getTitle()).isEqualTo("Roombook API");
    }
}
