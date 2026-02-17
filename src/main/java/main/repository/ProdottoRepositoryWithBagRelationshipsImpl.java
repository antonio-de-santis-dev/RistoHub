package main.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import main.domain.Prodotto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class ProdottoRepositoryWithBagRelationshipsImpl implements ProdottoRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String PRODOTTOS_PARAMETER = "prodottos";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Prodotto> fetchBagRelationships(Optional<Prodotto> prodotto) {
        return prodotto.map(this::fetchAllergenis);
    }

    @Override
    public Page<Prodotto> fetchBagRelationships(Page<Prodotto> prodottos) {
        return new PageImpl<>(fetchBagRelationships(prodottos.getContent()), prodottos.getPageable(), prodottos.getTotalElements());
    }

    @Override
    public List<Prodotto> fetchBagRelationships(List<Prodotto> prodottos) {
        return Optional.of(prodottos).map(this::fetchAllergenis).orElse(Collections.emptyList());
    }

    Prodotto fetchAllergenis(Prodotto result) {
        return entityManager
            .createQuery(
                "select prodotto from Prodotto prodotto left join fetch prodotto.allergenis where prodotto.id = :id",
                Prodotto.class
            )
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Prodotto> fetchAllergenis(List<Prodotto> prodottos) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, prodottos.size()).forEach(index -> order.put(prodottos.get(index).getId(), index));
        List<Prodotto> result = entityManager
            .createQuery(
                "select prodotto from Prodotto prodotto left join fetch prodotto.allergenis where prodotto in :prodottos",
                Prodotto.class
            )
            .setParameter(PRODOTTOS_PARAMETER, prodottos)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
