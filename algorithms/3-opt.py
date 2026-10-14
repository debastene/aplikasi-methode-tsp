import numpy as np
import random
import matplotlib.pyplot as plt
import time

# Fungsi untuk menghitung jarak Euclidean antara dua kota
def calculate_distance(city1, city2):
    return np.sqrt((city1[0] - city2[0])**2 + (city1[1] - city2[1])**2)

# Fungsi untuk menghitung total panjang tour
def total_tour_distance(tour, cities):
    dist = 0
    n = len(tour)
    for i in range(n):
        city_a = cities[tour[i]]
        city_b = cities[tour[(i + 1) % n]]
        dist += calculate_distance(city_a, city_b)
    return dist

# 3-opt Optimization (Single pass / basic implementation)
def opt_3(tour, cities):
    n = len(tour)
    best_tour = list(tour)
    best_dist = total_tour_distance(best_tour, cities)
    improved = True
    
    while improved:
        improved = False
        for i in range(n):
            for j in range(i + 2, n):
                for k in range(j + 2, n + (1 if i > 0 else 0)):
                    # Cek beberapa kemungkinan rekombinasi 3-opt
                    segment1 = best_tour[:i+1]
                    segment2 = best_tour[i+1:j+1]
                    segment3 = best_tour[j+1:k+1]
                    segment4 = best_tour[k+1:]
                    
                    # Variasi penyambungan 3-opt
                    variations = [
                        segment1 + segment2[::-1] + segment3 + segment4,
                        segment1 + segment2 + segment3[::-1] + segment4,
                        segment1 + segment2[::-1] + segment3[::-1] + segment4,
                        segment1 + segment3 + segment2 + segment4,
                        segment1 + segment3 + segment2[::-1] + segment4,
                        segment1 + segment3[::-1] + segment2 + segment4,
                    ]
                    
                    for var in variations:
                        d = total_tour_distance(var, cities)
                        if d < best_dist:
                            best_tour = var
                            best_dist = d
                            improved = True
                            break
                    if improved: break
                if improved: break
            if improved: break
    return best_tour