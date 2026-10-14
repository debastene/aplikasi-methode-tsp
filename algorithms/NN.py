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

# 1. Nearest Neighbor (NN)
def nearest_neighbor_tsp(cities, start_node=0):
    n = len(cities)
    unvisited = set(range(n))
    current = start_node
    tour = [current]
    unvisited.remove(current)
    
    while unvisited:
        next_city = min(unvisited, key=lambda city: calculate_distance(cities[current], cities[city]))
        tour.append(next_city)
        unvisited.remove(next_city)
        current = next_city
    return tour