
This measures the degree of specialization of a player across court types.

---

## Feature Engineering

### Overall Elo Difference

Difference between two players' overall Elo ratings.

### Blended Surface Elo

Combines:

- Overall Elo
- Surface-specific Elo

to create a more realistic estimate of player strength on a given surface.

### Recent Form

Tracks results from the player's most recent matches:

- Overall last-10-match form
- Hard court form
- Clay court form
- Grass court form

### Head-to-Head Record

Historical performance between two specific players.

---

## Machine Learning Models

Three predictive approaches were tested:

### Logistic Regression

Used as a baseline interpretable model.

| Metric | Value |
| :--- | :--- |
| Test Accuracy | 69.4% |
| Test AUC | 0.756 |

### Random Forest Classifier

| Metric | Value |
| :--- | :--- |
| Test Accuracy | 69.1% |
| Test AUC | 0.755 |

### XGBoost Classifier

| Metric | Value |
| :--- | :--- |
| Test Accuracy | 69.2% |
| Test AUC | 0.755 |

---

## Feature Importance

The most influential predictive variables were:

1. ATP Ranking Difference
2. Blended Surface Elo Difference
3. Overall Elo Difference
4. Recent Form
5. Surface-Specific Form
6. Head-to-Head Record

These results suggest that **ranking, long-term player strength, and court-specific ability** are the strongest indicators of match outcomes.

---

## Example Prediction

**Input:**

- Player A: Jannik Sinner
- Player B: Carlos Alcaraz
- Surface: Clay

**Prediction:**

| Player | Win Probability |
| :--- | :--- |
| Jannik Sinner | 53.37% |
| Carlos Alcaraz | 46.63% |

The model generates **win probabilities** rather than simple binary predictions.

---

## Visualizations

The project includes:

- Elo progression over time
- Surface-specific Elo trajectories
- Feature importance analysis
- Surface specialization rankings

<img width="677" height="366" alt="Elo progression" src="https://github.com/user-attachments/assets/2aac6c85-329a-46a9-9785-95f22f1b2042" />

<img width="678" height="404" alt="Feature importance" src="https://github.com/user-attachments/assets/42bdbb53-52d2-433d-8c6a-02be60c94e7e" />

---

## Key Results

- Processed **65,000+** training observations from ATP match history
- Built a dynamic Elo rating system that updates chronologically after every match
- Created separate Elo systems for hard, clay, and grass courts
- Engineered form-based and head-to-head features
- Tested Logistic Regression, Random Forest, and XGBoost
- **Best model:** Logistic Regression
- **Test Accuracy:** 69.4%
- **Test AUC:** 0.756

---

## Limitations

The model does not currently account for:

- Injuries
- Travel fatigue
- Tournament location effects
- Weather conditions
- ATP points decay
- Match-level statistics such as serve percentage or break-point conversion

These factors may improve predictive performance in future versions.

---

## Technologies Used

- Python
- Pandas
- NumPy
- Matplotlib
- Scikit-Learn
- XGBoost
- Jupyter Notebook

---

## Future Improvements

- Integrate injury and fatigue data
- Add match-level statistics (serve %, break points)
- Implement time-decay weighting for Elo ratings
- Deploy as an interactive web app
- Add player-level dashboards

