package main.repository;

import java.util.List;
import java.util.Optional;
import main.domain.Prodotto;
import org.springframework.data.domain.Page;

public interface ProdottoRepositoryWithBagRelationships {
    Optional<Prodotto> fetchBagRelationships(Optional<Prodotto> prodotto);

    List<Prodotto> fetchBagRelationships(List<Prodotto> prodottos);

    Page<Prodotto> fetchBagRelationships(Page<Prodotto> prodottos);
}
