# Judging System & Cross-Judge Normalization Methodology

## 1. Core Motivation & Problem Statement
In hackathons with multiple parallel judges, inherent scoring biases significantly distort fair competition:
1. **The "Harsh Judge" Effect**: A severe judge gives their top project a 75/100, while a lenient judge awards an average project an 88/100.
2. **Variance Discrepancy**: Some judges distribute scores widely (standard deviation $\sigma \approx 20$), whereas others cluster all scores in a narrow band (e.g. 80–85, $\sigma \approx 2$). A project judged by the high-variance judge experiences disproportionate leverage on the unnormalized average.
3. **Incomplete Block Designs**: Since every judge cannot evaluate every project in a large hackathon (e.g. 50 teams, 10 judges), assignments form an incomplete bipartite graph. Raw score averages are structurally invalid.

The platform solves these issues with structured weighted rubrics and a mathematically defensible cross-judge Z-score normalization engine with robust edge-case protection.

---

## 2. Weighted Scoring Formulation

For each project $p$ evaluated by judge $j$ on active rubric criteria $c \in C$:
Each criterion has:
- Maximum obtainable score $M_c > 0$
- Normalized weight $W_c \in (0, 1]$ such that $\sum_{c \in C} W_c = 1.0$
- Raw score awarded $R_{j, p, c} \in [0, M_c]$

The criterion weighted contribution is:
$$w_{j, p, c} = \left(\frac{R_{j, p, c}}{M_c}\right) \times W_c$$

The total evaluation score given by judge $j$ to project $p$ is:
$$S_{j, p} = \sum_{c \in C} w_{j, p, c} \times 100$$
Where $S_{j, p} \in [0, 100]$.

---

## 3. Cross-Judge Normalization Engine (Z-Score with Safeguards)

### 3.1 Standard Z-Score Formulation
For each judge $j$ who has completed evaluations for a set of projects $P_j$:
1. Judge Mean:
   $$\mu_j = \frac{1}{|P_j|} \sum_{p \in P_j} S_{j, p}$$
2. Judge Sample Standard Deviation:
   $$\sigma_j = \sqrt{\frac{1}{|P_j| - 1} \sum_{p \in P_j} (S_{j, p} - \mu_j)^2}$$

The standard Z-score for an evaluation is:
$$Z_{j, p} = \frac{S_{j, p} - \mu_j}{\sigma_j}$$

### 3.2 Critical Edge Cases & Safeguard Policies
A common failure in naive normalization is crashing on zero division or distorting small sample sizes. Our engine explicitly handles all boundary conditions:

| Edge Case | Condition | Fallback / Safeguard Strategy |
| :--- | :--- | :--- |
| **Zero Variance** | $\sigma_j = 0$ (Judge gave identical scores to all assigned projects) | Set $Z_{j, p} = 0.0$. Every project evaluated by this judge is treated as exactly at their mean performance. No division by zero. |
| **Single Evaluation** | $|P_j| = 1$ | When a judge only evaluates 1 project, $\sigma_j$ is undefined ($|P_j|-1 = 0$). Fallback: Compare $S_{j, p}$ against global event mean $\mu_{global}$ and global standard deviation $\sigma_{global}$. If $\sigma_{global} = 0$, $Z = 0.0$. |
| **Very Small Sample** | $2 \le |P_j| \le 3$ | Population standard deviation is utilized with a shrinkage prior towards the global standard deviation: $\sigma_{adj} = \sqrt{\frac{|P_j|-1}{|P_j|}\sigma_j^2 + \frac{1}{|P_j|}\sigma_{global}^2}$ to prevent extreme outlier $Z$-scores. |
| **Missing Evaluations** | Assigned but not yet scored | Excluded from the normalization run until submitted and finalized. |

### 3.3 Aggregation & Rescaling to Standardized Scale (0 - 100)
For each project $p$ receiving normalized scores $Z_{j, p}$ from judges $j \in J_p$:
1. Mean Project Z-Score:
   $$\bar{Z}_p = \frac{1}{|J_p|} \sum_{j \in J_p} Z_{j, p}$$
2. Re-scaling for Organizers and Participants:
   Raw $Z$-scores (typically $\in [-2.5, +2.5]$) are non-intuitive for non-statisticians. We map $\bar{Z}_p$ back to a standardized 0–100 scale centered at target mean $\mu_{target} = 75$ and standard deviation $\sigma_{target} = 12$:
   $$S_{final, p} = \text{clamp}\left(\mu_{target} + (\bar{Z}_p \times \sigma_{target}), 0.0, 100.0\right)$$
   This guarantees that:
   - Rank ordering is 100% preserved.
   - Scores remain on an intuitive grading scale.
   - Outliers are bounded between 0 and 100.

---

## 4. Judge Assignment Algorithms

The platform provides three assignment modes:
1. **Manual Assignment**: Organizers select specific judges and assign them to specific projects with collision detection.
2. **Batch by Track**: Automatically assigns all judges affiliated with a track to all submissions within that track.
3. **Algorithmic Balanced Round-Robin**:
   - Inputs: List of eligible judges $J$, list of submitted projects $P$, target reviews per project $K$ (e.g. 3).
   - Constraint 1: No judge may be assigned the same project more than once.
   - Constraint 2: Workload variance across judges is minimized ($\max_j |A_j| - \min_j |A_j| \le 1$).
   - Conflict of Interest: Judges belonging to a team or having flagged conflicts are strictly excluded from assignment to that project.
   - Execution: Greedily assigns project $p$ to judges with the fewest currently assigned evaluations, cycling in round-robin order.

---

## 5. Auditability and Dual-View Comparison
Organizers can inspect both:
- **Raw Average Score & Raw Rank**
- **Normalized Score & Normalized Rank**
- **Rank Shift ($\Delta = \text{Raw Rank} - \text{Normalized Rank}$)**

This transparency allows organizers to verify that normalization appropriately mitigated harsh or lenient judge anomalies without introducing black-box unpredictability.
